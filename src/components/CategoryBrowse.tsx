import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoryDiscSources } from '../lib/categoryPhotos'
import type { Category } from '../lib/database.types'
import { CategoryIcon, categoryColor } from './CategoryIcons'

type CategoryBrowseProps = {
  categories: Category[]
  navigateOnSelect?: boolean
  onSelectCategory?: (id: string) => void
  /** hub = OLX-like photo circles; list = denser rows */
  variant?: 'hub' | 'list'
}

function columnsForWidth(width: number, variant: 'hub' | 'list'): number {
  if (variant === 'hub') {
    if (width < 420) return 3
    if (width < 560) return 4
    if (width < 720) return 5
    if (width < 900) return 6
    if (width < 1100) return 7
    return 8
  }
  if (width < 520) return 1
  if (width < 820) return 2
  return 3
}

export function CategoryBrowse({
  categories,
  navigateOnSelect = true,
  onSelectCategory,
  variant = 'hub',
}: CategoryBrowseProps) {
  const navigate = useNavigate()
  const [openId, setOpenId] = useState<string | null>(null)
  const [cols, setCols] = useState(variant === 'hub' ? 6 : 3)
  const listRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const tops = useMemo(() => categories.filter((c) => !c.parent_id), [categories])
  const openTop = tops.find((t) => t.id === openId) || null
  const openIndex = openId ? tops.findIndex((t) => t.id === openId) : -1
  const rowEndIndex =
    openIndex >= 0 ? Math.min(tops.length - 1, Math.floor(openIndex / cols) * cols + (cols - 1)) : -1

  const subs = useMemo(
    () => (openId ? categories.filter((c) => c.parent_id === openId) : []),
    [categories, openId],
  )

  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    const measure = () => setCols(columnsForWidth(el.getBoundingClientRect().width, variant))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [variant])

  useEffect(() => {
    if (!openId || !panelRef.current) return
    panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [openId, cols])

  function go(catId: string) {
    onSelectCategory?.(catId)
    if (navigateOnSelect) navigate(`/auctions?cat=${encodeURIComponent(catId)}`)
  }

  function toggle(id: string) {
    const kids = categories.filter((c) => c.parent_id === id)
    if (kids.length === 0) {
      go(id)
      return
    }
    setOpenId((prev) => (prev === id ? null : id))
  }

  const panel =
    openTop != null ? (
      <div
        ref={panelRef}
        className="cat-browse-panel"
        role="region"
        aria-label={`Podkategorie: ${openTop.name}`}
      >
        <header className="cat-panel-head">
          <h3 className="cat-panel-title">{openTop.name}</h3>
          <p className="cat-panel-lead">Wybierz podkategorię albo zobacz wszystko w tym dziale.</p>
        </header>

        <div className="cat-panel-actions">
          <button type="button" className="btn btn-outline cat-panel-all" onClick={() => go(openTop.id)}>
            Wszystkie w „{openTop.name}”
          </button>
        </div>

        {subs.length === 0 ? (
          <p className="muted">Ten dział nie ma podziału — kliknij przycisk powyżej.</p>
        ) : (
          <ul className={`cat-sub-grid cols-${Math.min(cols, 3)}`}>
            {subs.map((s) => (
              <li key={s.id}>
                <button type="button" className="cat-sub-btn" onClick={() => go(s.id)}>
                  <span>{s.name}</span>
                  <span aria-hidden>→</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    ) : null

  return (
    <section className={`cat-browse cat-browse--${variant}`}>
      <div
        ref={listRef}
        className={variant === 'hub' ? 'cat-hub-grid' : 'cat-browse-list'}
        role="list"
        style={{ ['--cat-cols' as string]: String(cols) }}
      >
        {tops.map((c, i) => {
          const active = openId === c.id
          const colors = categoryColor(c.id, c.name)
          const count = categories.filter((x) => x.parent_id === c.id).length

          if (variant === 'hub') {
            const disc = categoryDiscSources(c.id, c.name)
            const eager = i < 12
            return (
              <Fragment key={c.id}>
                <button
                  type="button"
                  role="listitem"
                  className={active ? 'cat-hub-tile active' : 'cat-hub-tile'}
                  aria-expanded={count > 0 ? active : undefined}
                  onClick={() => toggle(c.id)}
                >
                  <span className="cat-hub-disc">
                    <picture>
                      <source srcSet={disc.webp} type="image/webp" />
                      <img
                        src={disc.jpg}
                        alt=""
                        width={92}
                        height={92}
                        loading={eager ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={i < 8 ? 'high' : 'auto'}
                      />
                    </picture>
                  </span>
                  <span className="cat-hub-name">{c.name}</span>
                </button>
                {i === rowEndIndex ? panel : null}
              </Fragment>
            )
          }

          return (
            <Fragment key={c.id}>
              <button
                type="button"
                role="listitem"
                className={active ? 'cat-tile active' : 'cat-tile'}
                aria-expanded={active}
                onClick={() => toggle(c.id)}
              >
                <span
                  className="cat-tile-icon"
                  style={{ background: colors.bg, color: colors.fg }}
                >
                  <CategoryIcon id={c.id} name={c.name} />
                </span>
                <span className="cat-tile-text">
                  <span className="cat-tile-name">{c.name}</span>
                  <span className="cat-tile-meta">
                    {count > 0 ? `${count} podkategorii` : 'Cały dział'}
                  </span>
                </span>
                <span className="cat-tile-arrow" aria-hidden>
                  {active ? '▾' : '›'}
                </span>
              </button>
              {i === rowEndIndex ? panel : null}
            </Fragment>
          )
        })}
      </div>

      {variant === 'list' && (
        <p className="cat-browse-foot muted">
          Nie wiesz gdzie szukać? <Link to="/auctions?all=1">Pokaż wszystkie aukcje</Link>
        </p>
      )}
    </section>
  )
}
