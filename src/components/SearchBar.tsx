import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState, type FormEvent } from 'react'

type SearchBarProps = {
  className?: string
  placeholder?: string
  initialQuery?: string
  compact?: boolean
}

export function SearchBar({
  className = '',
  placeholder = 'Szukaj: rower, iPhone, wiertarka…',
  initialQuery = '',
  compact = false,
}: SearchBarProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(initialQuery || params.get('q') || '')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const query = q.trim()
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    const cat = params.get('kat')
    if (cat) next.set('kat', cat)
    navigate(`/aukcje${next.toString() ? `?${next}` : ''}`)
  }

  return (
    <form className={`search-bar ${compact ? 'compact' : ''} ${className}`} onSubmit={onSubmit} role="search">
      <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Szukaj aukcji"
      />
      <button type="submit" className="btn btn-primary search-submit">
        Szukaj
      </button>
    </form>
  )
}
