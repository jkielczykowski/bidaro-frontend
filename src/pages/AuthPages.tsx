import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zalogować')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container narrow page">
      <h1>Zaloguj się</h1>
      <p className="muted">Wejdź, żeby licytować i wystawiać aukcje.</p>
      <form className="card-form" onSubmit={onSubmit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Hasło
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? 'Logowanie…' : 'Zaloguj'}
        </button>
      </form>
      <p className="muted">
        Nie masz konta? <Link to="/rejestracja">Zarejestruj się</Link>
      </p>
    </div>
  )
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await signUp(email, password, displayName)
      setInfo('Konto utworzone. Możesz się zalogować (sprawdź email, jeśli potwierdzenie jest włączone).')
      navigate('/logowanie')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zarejestrować')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container narrow page">
      <h1>Dołącz do Janusza</h1>
      <p className="muted">Załóż konto i wystaw pierwszą aukcję w 2 minuty.</p>
      <form className="card-form" onSubmit={onSubmit}>
        <label>
          Nick / imię
          <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Hasło
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        {info && <p className="success">{info}</p>}
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? 'Tworzenie…' : 'Załóż konto'}
        </button>
      </form>
      <p className="muted">
        Masz już konto? <Link to="/logowanie">Zaloguj się</Link>
      </p>
    </div>
  )
}
