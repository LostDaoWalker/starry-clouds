import { createServer } from 'node:http'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const dataDir = join(root, 'data')
const dbPath = join(dataDir, 'game.json')
const publicDir = existsSync(join(root, 'dist')) ? join(root, 'dist') : join(root, 'public')
const port = Number(process.env.PORT || 4173)

const starter = () => ({
  users: [],
  sessions: {},
  battles: [],
  nextId: 1,
})

function loadDb() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  if (!existsSync(dbPath)) writeFileSync(dbPath, JSON.stringify(starter(), null, 2))
  return JSON.parse(readFileSync(dbPath, 'utf8'))
}

function saveDb(db) {
  writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex')
  return `${salt}:${hash}`
}

function checkPassword(password, saved) {
  const [salt, hash] = saved.split(':')
  const attempt = hashPassword(password, salt).split(':')[1]
  return timingSafeEqual(Buffer.from(hash), Buffer.from(attempt))
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    level: user.level,
    qi: user.qi,
    jade: user.jade,
    hp: user.hp,
    wins: user.wins,
    losses: user.losses,
    avatar: user.avatar,
    title: titleFor(user.level),
  }
}

function titleFor(level) {
  if (level >= 12) return 'Cloud Immortal'
  if (level >= 8) return 'Lotus Adept'
  if (level >= 4) return 'Jade Disciple'
  return 'Sprout Cultivator'
}

function getSession(req, db) {
  const token = (req.headers.cookie || '').split('; ').find((c) => c.startsWith('sect_token='))?.split('=')[1]
  const userId = token && db.sessions[token]
  return userId ? db.users.find((user) => user.id === userId) : null
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => resolve(body ? JSON.parse(body) : {}))
  })
}

function send(res, status, payload, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers })
  res.end(JSON.stringify(payload))
}

function gain(user, qi, jade) {
  user.qi += qi
  user.jade += jade
  const needed = user.level * 30
  if (user.qi >= needed) {
    user.level += 1
    user.hp = 100 + user.level * 12
    user.qi -= needed
  }
}

const encounters = [
  { name: 'Dewdrop Slime', power: 10, qi: 16, jade: 4 },
  { name: 'Sleepy Bamboo Wisp', power: 18, qi: 22, jade: 7 },
  { name: 'Peach Blossom Shade', power: 27, qi: 30, jade: 10 },
  { name: 'Tiny Thunder Carp', power: 38, qi: 42, jade: 16 },
]

async function handleApi(req, res, db) {
  const body = req.method === 'POST' ? await readBody(req) : {}
  const user = getSession(req, db)

  if (req.url === '/api/register' && req.method === 'POST') {
    const name = String(body.name || '').trim().slice(0, 18)
    const password = String(body.password || '')
    if (name.length < 3 || password.length < 4) return send(res, 400, { error: 'Name or password is too tiny.' })
    if (db.users.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) {
      return send(res, 409, { error: 'That cultivator name is taken.' })
    }
    const newUser = {
      id: db.nextId++,
      name,
      password: hashPassword(password),
      level: 1,
      qi: 0,
      jade: 20,
      hp: 112,
      wins: 0,
      losses: 0,
      avatar: ['🌸', '🌙', '🍑', '💫'][db.users.length % 4],
    }
    const token = randomBytes(24).toString('hex')
    db.users.push(newUser)
    db.sessions[token] = newUser.id
    saveDb(db)
    return send(res, 200, { user: publicUser(newUser), leaderboard: leaderboard(db), battles: db.battles.slice(-8).reverse() }, {
      'set-cookie': `sect_token=${token}; HttpOnly; Path=/; SameSite=Lax`,
    })
  }

  if (req.url === '/api/login' && req.method === 'POST') {
    const found = db.users.find((entry) => entry.name.toLowerCase() === String(body.name || '').trim().toLowerCase())
    if (!found || !checkPassword(String(body.password || ''), found.password)) {
      return send(res, 401, { error: 'The sect gate did not recognize that.' })
    }
    const token = randomBytes(24).toString('hex')
    db.sessions[token] = found.id
    saveDb(db)
    return send(res, 200, { user: publicUser(found), leaderboard: leaderboard(db), battles: db.battles.slice(-8).reverse() }, {
      'set-cookie': `sect_token=${token}; HttpOnly; Path=/; SameSite=Lax`,
    })
  }

  if (req.url === '/api/me') {
    return send(res, 200, { user: user ? publicUser(user) : null, leaderboard: leaderboard(db), battles: db.battles.slice(-8).reverse() })
  }

  if (!user) return send(res, 401, { error: 'Please enter the sect first.' })

  if (req.url === '/api/logout' && req.method === 'POST') {
    const token = (req.headers.cookie || '').split('; ').find((c) => c.startsWith('sect_token='))?.split('=')[1]
    if (token) delete db.sessions[token]
    saveDb(db)
    return send(res, 200, { ok: true }, { 'set-cookie': 'sect_token=; Max-Age=0; Path=/' })
  }

  if (req.url === '/api/pve' && req.method === 'POST') {
    const encounter = encounters[Math.min(encounters.length - 1, Math.floor(Math.random() * (user.level + 1)))]
    const roll = Math.floor(Math.random() * 24) + user.level * 9
    const won = roll >= encounter.power
    if (won) {
      gain(user, encounter.qi, encounter.jade)
      user.wins += 1
    } else {
      user.losses += 1
      user.jade = Math.max(0, user.jade - 3)
    }
    db.battles.push({
      at: new Date().toISOString(),
      kind: 'PvE',
      text: won
        ? `${user.name} comforted a ${encounter.name} and gained ${encounter.qi} qi.`
        : `${user.name} shared snacks with a ${encounter.name} and retreated safely.`,
    })
    saveDb(db)
    return send(res, 200, { user: publicUser(user), result: db.battles.at(-1), leaderboard: leaderboard(db), battles: db.battles.slice(-8).reverse() })
  }

  if (req.url === '/api/train' && req.method === 'POST') {
    gain(user, 9, 1)
    db.battles.push({ at: new Date().toISOString(), kind: 'Train', text: `${user.name} meditated under peach petals.` })
    saveDb(db)
    return send(res, 200, { user: publicUser(user), result: db.battles.at(-1), leaderboard: leaderboard(db), battles: db.battles.slice(-8).reverse() })
  }

  if (req.url === '/api/pvp' && req.method === 'POST') {
    const rivals = db.users.filter((entry) => entry.id !== user.id)
    if (rivals.length === 0) return send(res, 400, { error: 'No rivals yet. Register another account to spar.' })
    const rival = rivals[Math.floor(Math.random() * rivals.length)]
    const myRoll = Math.random() * 20 + user.level * 11 + user.jade * 0.04
    const theirRoll = Math.random() * 20 + rival.level * 11 + rival.jade * 0.04
    const won = myRoll >= theirRoll
    if (won) {
      user.wins += 1
      rival.losses += 1
      gain(user, 18, 8)
    } else {
      user.losses += 1
      rival.wins += 1
      gain(rival, 12, 5)
    }
    db.battles.push({
      at: new Date().toISOString(),
      kind: 'PvP',
      text: won
        ? `${user.name} won a friendly cloud duel against ${rival.name}.`
        : `${rival.name} bowed sweetly after sparring with ${user.name}.`,
    })
    saveDb(db)
    return send(res, 200, { user: publicUser(user), result: db.battles.at(-1), leaderboard: leaderboard(db), battles: db.battles.slice(-8).reverse() })
  }

  send(res, 404, { error: 'Unknown shrine path.' })
}

function leaderboard(db) {
  return [...db.users]
    .sort((a, b) => b.level - a.level || b.wins - a.wins || b.jade - a.jade)
    .slice(0, 10)
    .map(publicUser)
}

function serveStatic(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  const safePath = normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = join(publicDir, safePath)
  const fallbackPath = join(publicDir, 'index.html')
  const target = existsSync(filePath) ? filePath : fallbackPath
  const type = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  }[extname(target)] || 'application/octet-stream'
  res.writeHead(200, { 'content-type': type })
  res.end(readFileSync(target))
}

createServer(async (req, res) => {
  const db = loadDb()
  if (req.url?.startsWith('/api/')) return handleApi(req, res, db)
  serveStatic(req, res)
}).listen(port, () => {
  console.log(`Cloud Blossom Sect is awake at http://localhost:${port}`)
})
