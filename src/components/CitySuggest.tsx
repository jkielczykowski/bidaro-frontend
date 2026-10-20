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

/** FluffyTag-style city autocomplete (Photon text search). */
export function CitySuggest({
  value,
  onChange,
  onPlaceSelect,
  error,
  required = true,
  label = 'Miejscowość',
  placeholder = 'Wpisz miejscowość…',
  compact = false,
}: CitySuggestProps) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const dirtyRef = useRef(false)
  const selectedNameRef = useRef<string | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(0)

  useEffect(() => {
    if (value === query || value === query.trim()) return
    // External value sync only — don't kill in-progress typing search
    if (dirtyRef.current) return
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
          setHighlight(0)
          setOpen(true)
        })
        .catch(() => {
          if (ctrl.signal.aborted) return
          setSuggestions([])
          setOpen(true)
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false)
        })
    }, 250)

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
    selectedNameRef.current = s.name
    setQuery(s.name)
    onChange(s.name)
    onPlaceSelect?.(s)
    setSuggestions([])
    setOpen(false)
  }

  function commitTyped() {
    const trimmed = query.trim()
    if (trimmed !== value) onChange(trimmed)
    if (selectedNameRef.current != null && trimmed !== selectedNameRef.current) {
      selectedNameRef.current = null
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
      else if (open && suggestions[0]) pick(suggestions[0])
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
          autoCorrect="off"
          spellCheck={false}
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            if (dirtyRef.current && query.trim().length >= 2) setOpen(true)
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (open && suggestions.length) return
              commitTyped()
              setOpen(false)
            }, 180)
          }}
          onChange={(e) => {
            dirtyRef.current = true
            const next = e.target.value
            setQuery(next)
            onChange(next.trim())
            if (selectedNameRef.current != null && next.trim() !== selectedNameRef.current) {
              selectedNameRef.current = null
              onPlaceSelect?.(null)
            }
          }}
          onKeyDown={onKeyDown}
        />
      </label>
      {showList && (
        <ul id={listId} className="city-suggest-list" role="listbox">
          {loading && suggestions.length === 0 && <li className="city-suggest-hint">Szukam…</li>}
          {!loading && suggestions.length === 0 && (
            <li className="city-suggest-hint">Brak podpowiedzi — wybierz z listy albo doprecyzuj nazwę</li>
          )}
          {suggestions.map((s, i) => (
            <li key={s.placeId}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={i === highlight ? 'active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault()
                  pick(s)
                }}
                onMouseEnter={() => setHighlight(i)}
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
