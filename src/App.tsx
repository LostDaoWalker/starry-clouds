import { useCallback, useEffect, useMemo, useState } from 'react'
import { Leaf, Swords, Sparkles, Trophy, UserRound } from 'lucide-react'
import { JadeSectWorld } from './components/JadeSectWorld'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import './App.css'

type Player = {
  id: number
  name: string
  level: number
  qi: number
  jade: number
  hp: number
  wins: number
  losses: number
  avatar: string
  title: string
}

type Battle = {
  at: string
  kind: string
  text: string
}

type GameState = {
  user: Player | null
  leaderboard: Player[]
  battles: Battle[]
}

type Panel = 'me' | 'cultivate' | 'rank' | 'log'

const emptyState: GameState = { user: null, leaderboard: [], battles: [] }

async function api(path: string, body?: Record<string, string>) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'A tiny cloud blocked the path.')
  return payload
}

export default function App() {
  const [state, setState] = useState<GameState>(emptyState)
  const [panel, setPanel] = useState<Panel | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('Welcome to Starry Clouds.')
  const [busy, setBusy] = useState(false)
  const [herbs, setHerbs] = useState(0)

  useEffect(() => {
    api('/api/me').then(setState).catch(() => setState(emptyState))
  }, [])

  const progress = useMemo(() => {
    if (!state.user) return 0
    return Math.min(100, Math.round((state.user.qi / (state.user.level * 30)) * 100))
  }, [state.user])

  async function submitAuth() {
    setBusy(true)
    try {
      const payload = await api(`/api/${mode}`, { name, password })
      setState(payload)
      setNotice(mode === 'register' ? 'Your star badge is ready!' : 'Welcome back, sweet cultivator!')
      setPanel(null)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Something went poof.')
    } finally {
      setBusy(false)
    }
  }

  async function action(kind: 'train' | 'pve' | 'pvp' | 'logout') {
    setBusy(true)
    try {
      const payload = await api(`/api/${kind}`, {})
      if (kind === 'logout') {
        setState(emptyState)
        setNotice('You left the star gate gently.')
      } else {
        setState(payload)
        setNotice(payload.result.text)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The clouds are shy right now.')
    } finally {
      setBusy(false)
    }
  }

  const handleWorldEvent = useCallback((event: { type: 'herb'; message: string }) => {
    setNotice(event.message)
    if (event.type === 'herb') setHerbs((count) => count + 1)
  }, [])

  if (!state.user) {
    return (
      <main className="shell gate-shell">
        <section className="gate-panel">
          <Card className="drawer-card">
            <p className="soft-label">Starry Clouds</p>
            <h1>Enter the sect first.</h1>
            <div className="tabs">
              <Button variant={mode === 'register' ? 'default' : 'ghost'} onClick={() => setMode('register')}>Register</Button>
              <Button variant={mode === 'login' ? 'default' : 'ghost'} onClick={() => setMode('login')}>Login</Button>
            </div>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Cultivator name" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Secret phrase" type="password" />
            <Button onClick={submitAuth} disabled={busy}>{mode === 'register' ? 'Receive badge' : 'Open gate'}</Button>
            <p className="notice">{notice}</p>
          </Card>
        </section>
      </main>
    )
  }

  return (
    <main className="shell">
      <section className="top-bar">
        <h1>Starry Clouds</h1>
        <div className="top-stats">
          <span><Leaf size={16} /> {herbs}</span>
          <span>Lv {state.user.level}</span>
        </div>
      </section>

      <section className="world-section">
        <JadeSectWorld onWorldEvent={handleWorldEvent} />
      </section>

      <nav className="dock" aria-label="Game menu">
        <Button variant={panel === 'me' ? 'default' : 'ghost'} onClick={() => setPanel(panel === 'me' ? null : 'me')}><UserRound size={18} /> Me</Button>
        <Button variant={panel === 'cultivate' ? 'default' : 'ghost'} onClick={() => setPanel(panel === 'cultivate' ? null : 'cultivate')}><Sparkles size={18} /> Cultivate</Button>
        <Button variant={panel === 'rank' ? 'default' : 'ghost'} onClick={() => setPanel(panel === 'rank' ? null : 'rank')}><Trophy size={18} /> Rank</Button>
        <Button variant={panel === 'log' ? 'default' : 'ghost'} onClick={() => setPanel(panel === 'log' ? null : 'log')}>Log</Button>
      </nav>

      <section className="single-panel">
        {panel === 'me' && (
          <Card className="drawer-card">
            <div className="player-card">
              <span className="avatar"><UserRound size={28} /></span>
              <div>
                <h2>{state.user.name}</h2>
                <p>{state.user.title}</p>
              </div>
            </div>
            <div className="stats">
              <span>Lv {state.user.level}</span>
              <span>{state.user.jade} jade</span>
              <span>{state.user.wins}W / {state.user.losses}L</span>
            </div>
            <div className="qi-bar" aria-label="Qi progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <Button variant="panel" onClick={() => action('logout')} disabled={busy}>Leave gate</Button>
            <p className="notice">{notice}</p>
          </Card>
        )}

        {panel === 'cultivate' && (
          <Card className="drawer-card">
            <h2>Daily cultivation</h2>
            <div className="actions">
              <Button onClick={() => action('train')} disabled={!state.user || busy}><Sparkles size={18} /> Meditate</Button>
              <Button onClick={() => action('pve')} disabled={!state.user || busy}><Swords size={18} /> Spirit quest</Button>
              <Button onClick={() => action('pvp')} disabled={!state.user || busy}><Trophy size={18} /> Cloud duel</Button>
            </div>
            <p className="notice">{notice}</p>
          </Card>
        )}

        {panel === 'rank' && (
          <Card className="drawer-card">
            <h2>Leaderboard</h2>
            <ol className="leaderboard">
              {state.leaderboard.length === 0 ? <li><span>No cultivators yet</span><strong>Lv 0</strong></li> : state.leaderboard.map((player) => (
                <li key={player.id}>
                  <span>{player.avatar} {player.name}</span>
                  <strong>Lv {player.level}</strong>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {panel === 'log' && (
          <Card className="drawer-card">
            <h2>Sect log</h2>
            <div className="log">
              {state.battles.length === 0 ? <p>No stars have fallen yet.</p> : state.battles.map((battle) => (
                <p key={`${battle.at}-${battle.text}`}><b>{battle.kind}</b> {battle.text}</p>
              ))}
            </div>
          </Card>
        )}
      </section>
    </main>
  )
}
