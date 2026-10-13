import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export type FilterMenuOption = {
  value: string
  label: string
  icon?: ReactNode
}

type FilterMenuProps = {
  label: string
  value: string
  options: FilterMenuOption[]
  placeholder?: string
  disabled?: boolean
  showAllOption?: boolean
  onChange: (value: string) => void
}

export function FilterMenu({
  label,
  value,
  options,
  placeholder = 'Wszystkie',
  disabled = false,
  showAllOption = true,
  onChange,
}: FilterMenuProps) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)
  const display = selected ? selected.label : placeholder

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={`filter-menu ${disabled ? 'is-disabled' : ''} ${open ? 'is-open' : ''}`} ref={wrapRef}>
      <span className="filter-menu-label">{label}</span>
      <button
        type="button"
        className="filter-menu-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className="filter-menu-value">
          {selected?.icon ? <span className="filter-menu-icon">{selected.icon}</span> : null}
          {display}
        </span>
        <span className="filter-menu-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && !disabled && (
        <ul id={listId} className="filter-menu-list" role="listbox">
          {showAllOption && (
            <li role="option" aria-selected={!selected || value === 'all'}>
              <button
                type="button"
                className={!selected || value === 'all' ? 'active' : ''}
                onClick={() => {
                  onChange('all')
                  setOpen(false)
                }}
              >
                <span>{placeholder}</span>
              </button>
            </li>
          )}
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={value === o.value}>
              <button
                type="button"
                className={value === o.value ? 'active' : ''}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                {o.icon ? <span className="filter-menu-icon">{o.icon}</span> : null}
                <span>{o.label}</span>
                {value === o.value ? <span className="filter-menu-check">✓</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
