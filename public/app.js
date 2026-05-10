let game = { user: null, leaderboard: [], battles: [] }
let mode = 'register'
let notice = 'Welcome to Starry Clouds.'
let busy = false

const authPanel = document.querySelector('#auth-panel')
const leaderboard = document.querySelector('#leaderboard')
const log = document.querySelector('#log')

async function api(path, body) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'A tiny cloud blocked the path.')
  return payload
}

function render() {
  renderAuth()
  renderLeaderboard()
  renderLog()
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.disabled = !game.user || busy
  })
}

function renderAuth() {
  if (game.user) {
    const progress = Math.min(100, Math.round((game.user.qi / (game.user.level * 30)) * 100))
    authPanel.innerHTML = `
      <div class="player-card">
        <span class="avatar">${game.user.avatar}</span>
        <div>
          <h2>${escapeHtml(game.user.name)}</h2>
          <p>${game.user.title}</p>
        </div>
      </div>
      <div class="stats">
        <span>Lv ${game.user.level}</span>
        <span>${game.user.jade} jade</span>
        <span>${game.user.wins}W / ${game.user.losses}L</span>
      </div>
      <div class="qi-bar" aria-label="Qi progress"><span style="width:${progress}%"></span></div>
      <button id="logout">Leave gate</button>
      <p class="notice">${escapeHtml(notice)}</p>
    `
    authPanel.querySelector('#logout').addEventListener('click', () => runAction('logout'))
    return
  }

  authPanel.innerHTML = `
    <h2>Enter the sect</h2>
    <div class="tabs">
      <button id="register-tab" class="${mode === 'register' ? 'active' : ''}">Register</button>
      <button id="login-tab" class="${mode === 'login' ? 'active' : ''}">Login</button>
    </div>
    <input id="name" placeholder="Cultivator name" maxlength="18" />
    <input id="password" placeholder="Secret phrase" type="password" />
    <button id="auth-submit">${mode === 'register' ? 'Receive badge' : 'Open gate'}</button>
    <p class="notice">${escapeHtml(notice)}</p>
  `
  authPanel.querySelector('#register-tab').addEventListener('click', () => {
    mode = 'register'
    render()
  })
  authPanel.querySelector('#login-tab').addEventListener('click', () => {
    mode = 'login'
    render()
  })
  authPanel.querySelector('#auth-submit').addEventListener('click', submitAuth)
}

function renderLeaderboard() {
  leaderboard.innerHTML = game.leaderboard.length
    ? game.leaderboard.map((player) => `
      <li>
        <span>${player.avatar} ${escapeHtml(player.name)}</span>
        <strong>Lv ${player.level}</strong>
      </li>
    `).join('')
    : '<li><span>No cultivators yet</span><strong>Lv 0</strong></li>'
}

function renderLog() {
  log.innerHTML = game.battles.length
    ? game.battles.map((battle) => `<p><b>${battle.kind}</b> ${escapeHtml(battle.text)}</p>`).join('')
    : '<p>No petals have fallen yet.</p>'
}

async function submitAuth() {
  busy = true
  render()
  try {
    const name = document.querySelector('#name').value
    const password = document.querySelector('#password').value
    game = await api(`/api/${mode}`, { name, password })
    notice = mode === 'register' ? 'Your sect badge is ready!' : 'Welcome back, sweet cultivator!'
  } catch (error) {
    notice = error.message
  } finally {
    busy = false
    render()
  }
}

async function runAction(kind) {
  busy = true
  render()
  try {
    const payload = await api(`/api/${kind}`, {})
    if (kind === 'logout') {
      game = { user: null, leaderboard: [], battles: [] }
      notice = 'You left the sect gate gently.'
    } else {
      game = payload
      notice = payload.result.text
    }
  } catch (error) {
    notice = error.message
  } finally {
    busy = false
    render()
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char])
}

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', () => runAction(button.dataset.action))
})

api('/api/me').then((payload) => {
  game = payload
  render()
}).catch(render)
