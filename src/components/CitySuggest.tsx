import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { searchCities, type CitySuggestion } from '../lib/cities'

type CitySuggestProps = {
  value: string
  onChange: (city: string) => void
  onPlaceSelect?: (place: CitySuggestion | null) => void
  error?: string
  required?: boolean
  label?: string
  placeholder?: string
  compact?: boolean
}

export function CitySuggest({
  value,
  onChange,
  onPlaceSelect,
  error,
  required = true,
  label = 'Miasto',
  placeholder = 'Np. Warszawa, Kraków…',
  compact = false,
}: CitySuggestProps) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const dirtyRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(0)

  useEffect(() => {
    if (value === query || value === query.trim()) return
    dirtyRef.current = false
    setQuery(value)
    setOpen(false)
    setSuggestions([])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: react to value only
  }, [value])

  useEffect(() => {
    const q = query.trim()
    if (!dirtyRef.current) {
      setLoading(false)
      return
    }
    if (q.length < 2) {
      setSuggestions([])
      setLoading(false)
      setOpen(false)
      return
    }

    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      setLoading(true)
      setOpen(true)
      void searchCities(q, ctrl.signal)
        .then((rows) => {
          if (ctrl.signal.aborted) return
          setSuggestions(rows)
          setOpen(true)
          setHighlight(0)
        })
        .catch(() => {
          if (ctrl.signal.aborted) return
          setSuggestions([])
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false)
        })
    }, 200)

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
    dirtyRef.current = false
    setQuery(s.name)
    onChange(s.name)
    onPlaceSelect?.(s)
    setSuggestions([])
    setOpen(false)
  }

  function commitTyped() {
    const trimmed = query.trim()
    if (trimmed !== value) {
      onChange(trimmed)
      onPlaceSelect?.(null)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (suggestions.length) setOpen(true)
      setHighlight((h) => Math.min(h + 1, Math.max(suggestions.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && suggestions[highlight]) pick(suggestions[highlight])
      else {
        commitTyped()
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && dirtyRef.current && query.trim().length >= 2

  return (
    <div className={`city-suggest ${compact ? 'is-compact' : ''} ${error ? 'has-error' : ''}`} ref={wrapRef}>
      <label>
        <span className="label-text">
          {label}
          {required && <span className="req"> *</span>}
        </span>
        <input
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            if (dirtyRef.current && query.trim().length >= 2) setOpen(true)
          }}
          onBlur={() => {
            window.setTimeout(() => {
              commitTyped()
              setOpen(false)
            }, 180)
          }}
          onChange={(e) => {
            dirtyRef.current = true
            const next = e.target.value
            setQuery(next)
            onChange(next.trim())
            onPlaceSelect?.(null)
          }}
          onKeyDown={onKeyDown}
        />
      </label>
      {showList && (
        <ul id={listId} className="city-suggest-list" role="listbox">
          {loading && suggestions.length === 0 && <li className="city-suggest-hint">Szukam miast…</li>}
          {!loading && suggestions.length === 0 && (
            <li className="city-suggest-hint">Brak podpowiedzi — możesz wpisać miasto ręcznie</li>
          )}
          {suggestions.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={i === highlight ? 'active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(s)}
              >
                <strong>{s.name}</strong>
                {s.displayName !== s.name && (
                  <span className="city-suggest-meta">{s.displayName}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
