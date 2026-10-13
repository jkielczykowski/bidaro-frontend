type PaginationProps = {
  page: number
  pageCount: number
  onChange: (page: number) => void
  /** Optional result count — shows "X wyników" meta */
  total?: number
  /** aria-label override */
  label?: string
  className?: string
}

export function Pagination({
  page,
  pageCount,
  onChange,
  total,
  label = 'Strony wyników',
  className = '',
}: PaginationProps) {
  // Always show when there is at least one page of results (total omitted = legacy pages)
  if (pageCount < 1) return null
  if (total != null && total <= 0) return null

  const pages = Array.from({ length: Math.max(pageCount, 1) }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 2)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && typeof arr[idx - 1] === 'number' && p - (arr[idx - 1] as number) > 1) {
        acc.push('…')
      }
      acc.push(p)
      return acc
    }, [])

  return (
    <nav className={`pagination ${className}`.trim()} aria-label={label}>
      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ← Poprzednia
      </button>

      <div className="pagination-pages">
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={p === page ? 'page-btn active' : 'page-btn'}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        className="btn btn-outline btn-sm"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Następna →
      </button>

      <p className="pagination-meta" aria-live="polite">
        Strona {page} z {Math.max(pageCount, 1)}
        {total != null ? (
          <>
            <span className="pagination-meta-sep">·</span>
            {total} {total === 1 ? 'wynik' : total < 5 ? 'wyniki' : 'wyników'}
          </>
        ) : null}
      </p>
    </nav>
  )
}
