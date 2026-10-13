import { useEffect, useMemo, useState } from 'react'
import type { Category } from '../lib/database.types'
import { CategoryIcon } from './CategoryIcons'

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

function isLeaf(categories: Category[], id: string) {
  return !!id && !categories.some((c) => c.parent_id === id)
}

export function CategoryPicker({ categories, value, onChange, error }: CategoryPickerProps) {
  const tops = useMemo(() => categories.filter((c) => !c.parent_id), [categories])
  const chain = value ? ancestors(categories, value) : []

  const [draftL1, setDraftL1] = useState(chain[0] || '')
  const [draftL2, setDraftL2] = useState(chain[1] || '')

  useEffect(() => {
    if (!value) return
    const next = ancestors(categories, value)
    setDraftL1(next[0] || '')
    setDraftL2(next[1] || '')
  }, [value, categories])

  const level1 = draftL1
  const level2 = draftL2

  const mid = useMemo(
    () => (level1 ? categories.filter((c) => c.parent_id === level1) : []),
    [categories, level1],
  )
  const leaves = useMemo(
    () => (level2 ? categories.filter((c) => c.parent_id === level2) : []),
    [categories, level2],
  )

  const topName = tops.find((t) => t.id === level1)?.name
  const midName = mid.find((m) => m.id === level2)?.name
  const selectedOk = Boolean(value && isLeaf(categories, value))

  function pickTop(id: string) {
    setDraftL1(id)
    setDraftL2('')
    const kids = categories.filter((c) => c.parent_id === id)
    if (!kids.length) onChange(id)
    else onChange('')
  }

  function pickMid(id: string) {
    setDraftL2(id)
    const kids = categories.filter((c) => c.parent_id === id)
    if (!kids.length) onChange(id)
    else onChange('')
  }

  return (
    <div className={`category-picker ${error ? 'has-error' : ''}`}>
      <div className="cat-pick-head">
        <span className="field-label" style={{ marginBottom: 0 }}>
          Kategoria<span className="req"> *</span>
        </span>
        <p className="cat-pick-hint muted">Wybierz kolejno: dział → podkategoria → szczegóły.</p>
      </div>

      <p className="cat-pick-step">1. Dział</p>
      <div className="cat-pick-grid" role="listbox" aria-label="Główna kategoria">
        {tops.map((p) => (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={level1 === p.id}
            className={level1 === p.id ? 'cat-pick-tile active' : 'cat-pick-tile'}
            onClick={() => pickTop(p.id)}
          >
            <span className="cat-pick-icon">
              <CategoryIcon id={p.id} name={p.name} />
            </span>
            <span className="cat-pick-name">{p.name}</span>
          </button>
        ))}
      </div>

      {level1 && mid.length > 0 && (
        <>
          <p className="cat-pick-step">
            2. Podkategoria
            {topName ? <span className="muted"> · {topName}</span> : null}
          </p>
          <div className="cat-pick-subs" role="listbox" aria-label="Podkategoria">
            {mid.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={level2 === c.id}
                className={level2 === c.id ? 'cat-pick-sub active' : 'cat-pick-sub'}
                onClick={() => pickMid(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      {level2 && leaves.length > 0 && (
        <>
          <p className="cat-pick-step">
            3. Szczegóły
            {midName ? <span className="muted"> · {midName}</span> : null}
          </p>
          <div className="cat-pick-subs" role="listbox" aria-label="Szczegółowa kategoria">
            {leaves.map((c) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={value === c.id}
                className={value === c.id ? 'cat-pick-sub active' : 'cat-pick-sub'}
                onClick={() => onChange(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedOk ? (
        <p className="category-selected">
          Wybrane: <strong>{pathLabels(categories, value).join(' → ')}</strong>
        </p>
      ) : level1 ? (
        <p className="category-selected muted">
          {leaves.length > 0 && !value
            ? 'Wybierz jeszcze szczegółową kategorię.'
            : mid.length > 0 && !level2
              ? 'Wybierz podkategorię.'
              : 'Dokończ wybór kategorii.'}
        </p>
      ) : null}

      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
