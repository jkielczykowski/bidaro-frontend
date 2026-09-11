import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useUnreadMessages } from '../lib/unreadMessages'
import { SearchBar } from './SearchBar'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth()
  const { unread } = useUnreadMessages()

  return (
    <div className="app-shell">
      <header className="header">
        <nav className="nav container">
          <Link to="/" className="logo">
            <img className="logo-icon" src="/logo.png" alt="" width={40} height={40} />
            <span className="logo-text">
              Janusz<em>Licytuje</em>
            </span>
          </Link>

          <div className="nav-search">
            <SearchBar compact />
          </div>

          <div className="nav-links">
            <NavLink to="/" end>
              Start
            </NavLink>
            <NavLink to="/aukcje">Aukcje</NavLink>
            <NavLink to="/wystaw">Wystaw</NavLink>
            {user && <NavLink to="/moje">Moje</NavLink>}
            {user && (
              <NavLink to="/wiadomosci" className="nav-messages">
                Wiadomości
                {unread > 0 && <span className="nav-unread">{unread > 99 ? '99+' : unread}</span>}
              </NavLink>
            )}
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <span className="nav-user">{profile?.display_name ?? user.email}</span>
                <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <Link to="/logowanie" className="btn btn-ghost">
                  Zaloguj
                </Link>
                <Link to="/rejestracja" className="btn btn-primary">
                  Dołącz
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <p>© {new Date().getFullYear()} JanuszLicytuje — licytacje po polsku.</p>
        </div>
      </footer>
    </div>
  )
}
