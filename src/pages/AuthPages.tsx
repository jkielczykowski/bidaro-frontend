import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { isValidPlPhone, normalizePlPhone } from '../lib/phone'

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
          <span className="label-text">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span className="label-text">Hasło</span>
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
        Nie masz konta? <Link to="/register">Zarejestruj się</Link>
      </p>
    </div>
  )
}

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (!displayName.trim() || displayName.trim().length < 2) {
        throw new Error('Podaj nick (min. 2 znaki)')
      }
      if (!email.includes('@')) {
        throw new Error('Podaj prawidłowy email')
      }
      if (password.length < 6) {
        throw new Error('Hasło min. 6 znaków')
      }
      const normalized = normalizePlPhone(phone)
      if (!normalized || !isValidPlPhone(phone)) {
        throw new Error('Podaj prawidłowy numer telefonu (9 cyfr, np. 512 345 678)')
      }

      await signUp(email, password, displayName.trim(), normalized)
      navigate('/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nie udało się zarejestrować'
      if (/profiles_phone_unique|duplicate key.*phone/i.test(msg)) {
        setError('Ten numer telefonu jest już zajęty')
      } else {
        setError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container narrow page">
      <h1>Dołącz do Bidigo</h1>

      <form className="card-form" onSubmit={(e) => void onSubmit(e)} noValidate>
        <label>
          <span className="label-text">
            Nick / imię<span className="req"> *</span>
          </span>
          <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          <span className="label-text">
            Email<span className="req"> *</span>
          </span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span className="label-text">
            Hasło<span className="req"> *</span>
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          <span className="label-text">
            Numer telefonu<span className="req"> *</span>
          </span>
          <div className="phone-input-row">
            <span className="phone-prefix">+48</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              placeholder="512 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? 'Tworzenie konta…' : 'Załóż konto'}
        </button>
      </form>

      <p className="muted">
        Masz już konto? <Link to="/login">Zaloguj się</Link>
      </p>
    </div>
  )
}
