import { useMemo } from 'react'
import type { Category } from '../lib/database.types'

type CategoryPickerProps = {
  categories: Category[]
  value: string
  onChange: (id: string) => void
  error?: string | null
}

function pathLabels(categories: Category[], id: string): string[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const parts: string[] = []
  let cur = byId.get(id)
  while (cur) {
    parts.unshift(cur.name)
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
  }
  return parts
}

function ancestors(categories: Category[], id: string): string[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const chain: string[] = []
  let cur = byId.get(id)
  while (cur) {
    chain.unshift(cur.id)
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined
  }
  return chain
}

export function CategoryPicker({ categories, value, onChange, error }: CategoryPickerProps) {
  const tops = useMemo(() => categories.filter((c) => !c.parent_id), [categories])
  const chain = value ? ancestors(categories, value) : []
  const level1 = chain[0] || ''
  const level2 = chain[1] || ''
  const level3 = chain[2] || ''

  const mid = useMemo(
    () => (level1 ? categories.filter((c) => c.parent_id === level1) : []),
    [categories, level1],
  )
  const leaves = useMemo(
    () => (level2 ? categories.filter((c) => c.parent_id === level2) : []),
    [categories, level2],
  )

  function pickTop(id: string) {
    const kids = categories.filter((c) => c.parent_id === id)
    if (!kids.length) {
      onChange(id)
      return
    }
    const firstMid = kids[0]
    const grand = categories.filter((c) => c.parent_id === firstMid.id)
    onChange(grand[0]?.id || firstMid.id)
  }

  function pickMid(id: string) {
    const kids = categories.filter((c) => c.parent_id === id)
    onChange(kids[0]?.id || id)
  }

  return (
    <div className={`category-picker ${error ? 'has-error' : ''}`}>
      <span className="field-label">
        Kategoria<span className="req"> *</span>
      </span>

      <div className="category-parents" role="listbox" aria-label="Główna kategoria">
        {tops.map((p) => (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={level1 === p.id}
            className={level1 === p.id ? 'cat-chip active' : 'cat-chip'}
            onClick={() => pickTop(p.id)}
          >
            <span className="cat-icon">{p.icon || '📦'}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {mid.length > 0 && (
        <>
          <span className="field-label subtle">
            Podkategoria<span className="req"> *</span>
          </span>
          <div className="category-children" role="listbox" aria-label="Podkategoria">
            {mid.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={level2 === c.id}
                className={level2 === c.id ? 'cat-sub active' : 'cat-sub'}
                onClick={() => pickMid(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      {leaves.length > 0 && (
        <>
          <span className="field-label subtle">
            Szczegółowa kategoria<span className="req"> *</span>
          </span>
          <div className="category-children" role="listbox" aria-label="Szczegółowa kategoria">
            {leaves.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={level3 === c.id || value === c.id}
                className={value === c.id ? 'cat-sub active' : 'cat-sub'}
                onClick={() => onChange(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      {value && (
        <p className="category-selected muted">
          Wybrane: <strong>{pathLabels(categories, value).join(' → ')}</strong>
        </p>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
