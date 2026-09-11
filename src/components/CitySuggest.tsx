import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { searchCities, type CitySuggestion } from '../lib/cities'

type CitySuggestProps = {
  value: string
  onChange: (city: string) => void
  error?: string
  required?: boolean
  label?: string
}

export function CitySuggest({
  value,
  onChange,
  error,
  required = true,
  label = 'Miasto',
}: CitySuggestProps) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(0)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      setLoading(true)
      void searchCities(q, ctrl.signal)
        .then((rows) => {
          setSuggestions(rows)
          setOpen(rows.length > 0)
          setHighlight(0)
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false))
    }, 350)

    return () => {
      window.clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function pick(s: CitySuggestion) {
    setQuery(s.name)
    onChange(s.name)
    setSuggestions([])
    setOpen(false)
  }

  function commitTyped() {
    const trimmed = query.trim()
    if (trimmed !== value) onChange(trimmed)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, Math.max(suggestions.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[highlight]) pick(suggestions[highlight])
      else commitTyped()
      setOpen(false)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={`city-suggest ${error ? 'has-error' : ''}`} ref={wrapRef}>
      <label>
        <span className="label-text">
          {label}
          {required && <span className="req"> *</span>}
        </span>
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder="Wpisz miasto…"
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          onBlur={() => {
            window.setTimeout(() => {
              commitTyped()
              setOpen(false)
            }, 150)
          }}
          onChange={(e) => {
            const next = e.target.value
            setQuery(next)
            onChange(next.trim())
          }}
          onKeyDown={onKeyDown}
        />
      </label>
      {open && (loading || suggestions.length > 0) && (
        <ul id={listId} className="city-suggest-list" role="listbox">
          {loading && suggestions.length === 0 && <li className="city-suggest-hint">Szukam…</li>}
          {suggestions.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={value === s.name}
                className={i === highlight ? 'active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(s)}
              >
                <strong>{s.name}</strong>
                {s.displayName !== s.name && <span className="city-suggest-meta">{s.displayName}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
