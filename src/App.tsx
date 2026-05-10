import { useCallback, useEffect, useMemo, useState } from 'react'
import { HeartHandshake, Leaf, Swords, Sparkles, Trophy, UserRound } from 'lucide-react'
import { Starfield } from './components/Starfield'
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

  const handleWorldEvent = useCallback((event: { type: 'herb' | 'friend'; message: string }) => {
    setNotice(event.message)
    if (event.type === 'herb') setHerbs((count) => count + 1)
  }, [])

  return (
    <main className="shell">
      <Starfield />
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="soft-label">Starry Clouds</p>
          <h1>Jade skies, tiny buddies, cozy cultivation.</h1>
          <p>A brutally simple online-ish xianxia hangout: enter the sect, walk around, gather herbs, meditate, and gently spar.</p>
        </div>
      </section>

      <section className="world-section">
        <Card className="world-panel">
          <div className="world-topline">
            <div>
              <p className="soft-label">Cloud Sect Hub</p>
              <h2>Walk the little jade platform</h2>
            </div>
            <div className="mini-stats">
              <span><Leaf size={16} /> {herbs} herbs</span>
              <span><HeartHandshake size={16} /> cozy online vibes</span>
            </div>
          </div>
          <JadeSectWorld onWorldEvent={handleWorldEvent} />
        </Card>
      </section>

      <section className="game-grid">
        <Card className="auth-panel">
          {state.user ? (
            <>
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
            </>
          ) : (
            <>
              <h2>Enter the sect</h2>
              <div className="tabs">
                <Button variant={mode === 'register' ? 'default' : 'ghost'} onClick={() => setMode('register')}>Register</Button>
                <Button variant={mode === 'login' ? 'default' : 'ghost'} onClick={() => setMode('login')}>Login</Button>
              </div>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Cultivator name" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Secret phrase" type="password" />
              <Button onClick={submitAuth} disabled={busy}>{mode === 'register' ? 'Receive badge' : 'Open gate'}</Button>
            </>
          )}
          <p className="notice">{notice}</p>
        </Card>

        <Card className="loop-panel primary-actions">
          <h2>Daily cultivation</h2>
          <div className="actions">
            <Button onClick={() => action('train')} disabled={!state.user || busy}><Sparkles size={18} /> Meditate</Button>
            <Button onClick={() => action('pve')} disabled={!state.user || busy}><Swords size={18} /> PvE spirit quest</Button>
            <Button onClick={() => action('pvp')} disabled={!state.user || busy}><Trophy size={18} /> PvP cloud duel</Button>
          </div>
        </Card>

        <Card>
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

        <Card>
          <h2>Sect log</h2>
          <div className="log">
            {state.battles.length === 0 ? <p>No stars have fallen yet.</p> : state.battles.map((battle) => (
              <p key={`${battle.at}-${battle.text}`}><b>{battle.kind}</b> {battle.text}</p>
            ))}
          </div>
        </Card>
      </section>
    </main>
  )
}
