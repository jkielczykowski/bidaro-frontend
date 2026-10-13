import { Link } from 'react-router-dom'

export function BidigoLogo({
  className = '',
  to = '/',
  onClick,
}: {
  className?: string
  to?: string
  onClick?: () => void
}) {
  return (
    <Link to={to} className={`bidigo-logo ${className}`.trim()} aria-label="Bidigo — start" onClick={onClick}>
      bidigo<span className="bidigo-dot">.</span>
    </Link>
  )
}
