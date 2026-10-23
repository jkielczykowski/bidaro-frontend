import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pagination } from '../components/Pagination'
import { useAuth } from '../lib/auth'
import { ApiError, startFeeCheckout } from '../lib/bidigoApi'
import type { SellerFee } from '../lib/database.types'
import { formatPln } from '../lib/format'
import { supabase } from '../lib/supabase'

type FeeRow = SellerFee & { auction?: { title: string } | null }

const PAGE_SIZE = 12
/** Unpaid fees are debts: all of them stay on top, unpaginated (up to this many) */
const PENDING_LIMIT = 100

type StatusFilter = 'all' | 'pending' | 'paid'
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'pending', label: 'Do zapłaty' },
  { value: 'paid', label: 'Opłacone' },
]

type Filters = { status: StatusFilter; q: string; from: string; to: string }

function readFilters(params: URLSearchParams): Filters {
  const status = params.get('status')
  return {
    status: status === 'pending' || status === 'paid' ? status : 'all',
    q: params.get('q') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  }
}

/** The same title/date filters on any seller_fees query (dates = day of the sale, local time) */
function applyFilters<Q extends { ilike: Function; gte: Function; lt: Function }>(query: Q, f: Filters): Q {
  let q = query
  const text = f.q.trim().replace(/[%_,()]/g, ' ').trim()
  if (text) q = q.ilike('auction.title', `%${text}%`)
  if (f.from) q = q.gte('created_at', new Date(`${f.from}T00:00:00`).toISOString())
  if (f.to) {
    const end = new Date(`${f.to}T00:00:00`)
    end.setDate(end.getDate() + 1)
    q = q.lt('created_at', end.toISOString())
  }
  return q
}

function plural(n: number) {
  return n === 1 ? 'pozycja' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'pozycje' : 'pozycji'
}

const STATUS_LABEL: Record<SellerFee['status'], string> = {
  pending: 'Do zapłaty',
  paid: 'Opłacona',
  cancelled: 'Anulowana',
  waived: 'Umorzona',
}

export function MyFeesPage() {
  const { user } = useAuth()
  const [pendingFees, setPendingFees] = useState<FeeRow[]>([])
  const [settledFees, setSettledFees] = useState<FeeRow[]>([])
  const [settledTotal, setSettledTotal] = useState(0)
  const [allCount, setAllCount] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  // Stripe Checkout sends the seller back here with ?paid=<fee id> or ?cancelled=<fee id>
  // Filters and page live in the URL (?status=&q=&from=&to=&page=), so a refresh keeps them
  const [params, setParams] = useSearchParams()
  const returnedPaid = params.get('paid')
  const returnedCancelled = params.get('cancelled')
  const filters = readFilters(params)
  const { status, q, from, to } = filters
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [search, setSearch] = useState(q)
  const filtered = status !== 'all' || !!q.trim() || !!from || !!to

  const pageCount = Math.max(1, Math.ceil(settledTotal / PAGE_SIZE))

  const setParam = useCallback(
    (changes: Record<string, string>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(changes)) {
            if (v && !(k === 'status' && v === 'all') && !(k === 'page' && v === '1')) next.set(k, v)
            else next.delete(k)
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  // Typing in the search box updates the URL after a short pause
  useEffect(() => {
    if (search === q) return
    const t = setTimeout(() => setParam({ q: search }), 300)
    return () => clearTimeout(t)
  }, [search, q, setParam])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const f: Filters = { status, q, from, to }
    const select = f.q.trim() ? '*, auction:auctions!inner(title)' : '*, auction:auctions(title)'

    const [{ data: pendingAll }, { count: everything }, pendingRes, settledRes] = await Promise.all([
      // Summary: everything still owed, regardless of the filters
      supabase.from('seller_fees').select('fee_amount').eq('seller_id', user.id).eq('status', 'pending'),
      supabase.from('seller_fees').select('id', { count: 'exact', head: true }).eq('seller_id', user.id),
      f.status === 'paid'
        ? Promise.resolve({ data: [] })
        : applyFilters(
            supabase.from('seller_fees').select(select).eq('seller_id', user.id).eq('status', 'pending'),
            f,
          )
            .order('created_at', { ascending: false })
            .limit(PENDING_LIMIT),
      f.status === 'pending'
        ? Promise.resolve({ data: [], count: 0 })
        : applyFilters(
            f.status === 'paid'
              ? supabase.from('seller_fees').select(select, { count: 'exact' }).eq('seller_id', user.id).eq('status', 'paid')
              : supabase.from('seller_fees').select(select, { count: 'exact' }).eq('seller_id', user.id).neq('status', 'pending'),
            f,
          )
            .order('paid_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    ])

    const owed = (pendingAll ?? []) as { fee_amount: number }[]
    setPendingCount(owed.length)
    setPendingTotal(owed.reduce((s, x) => s + Number(x.fee_amount), 0))
    setAllCount(everything ?? 0)
    setPendingFees((pendingRes.data as FeeRow[] | null) ?? [])
    setSettledFees((settledRes.data as FeeRow[] | null) ?? [])
    setSettledTotal(('count' in settledRes ? settledRes.count : 0) ?? 0)
    setLoading(false)
  }, [user, status, q, from, to, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!loading && page > pageCount) setParam({ page: String(pageCount) })
  }, [loading, page, pageCount, setParam])

  // The fee turns paid only when Stripe's webhook reaches bidigo-api — usually a second or two
  useEffect(() => {
    if (!returnedPaid || !user) return
    let stopped = false
    let tries = 0
    const check = async () => {
      const { data } = await supabase.from('seller_fees').select('status').eq('id', returnedPaid).maybeSingle()
      if (stopped) return
      if (data?.status === 'paid') {
        setConfirmed(true)
        void load()
      } else if (++tries < 40) {
        setTimeout(check, 1500)
      }
    }
    void check()
    return () => {
      stopped = true
    }
  }, [returnedPaid, user, load])

  async function pay(feeId: string) {
    setPaying(feeId)
    setPayError(null)
    try {
      const { checkoutUrl } = await startFeeCheckout(feeId)
      window.location.assign(checkoutUrl)
    } catch (e) {
      setPaying(null)
      const status = e instanceof ApiError ? e.status : 0
      if (status === 409) {
        setPayError('Ta prowizja jest już rozliczona.')
        void load()
      } else if (status === 503) {
        setPayError('Płatności są chwilowo niedostępne. Spróbuj później.')
      } else {
        setPayError('Nie udało się rozpocząć płatności. Spróbuj ponownie.')
      }
    }
  }

  function goPage(p: number) {
    setParam({ page: String(Math.min(Math.max(1, p), pageCount)) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearFilters() {
    setSearch('')
    setParam({ status: '', q: '', from: '', to: '' })
  }

  function feeCard(f: FeeRow): ReactNode {
    const settled = f.status !== 'pending'
    return (
      <article
        key={f.id}
        className={`my-card${settled ? ' my-card-settled' : ' my-card-warn'}`}
        data-fee-status={f.status}
      >
        <div className="my-card-top">
          <p className="my-card-kicker">{new Date(f.created_at).toLocaleDateString('pl-PL')}</p>
          <span className={`fee-status ${f.status}`}>
            {f.status === 'paid' ? '✓ ' : ''}
            {STATUS_LABEL[f.status] ?? f.status}
          </span>
        </div>
        <h3 className="my-card-title">{f.auction?.title || 'Aukcja'}</h3>
        <p className="my-card-body muted">
          Sprzedaż {formatPln(f.sale_price)} · prowizja {Number(f.fee_percent)}%
        </p>
        <p className="my-fee-amount">{formatPln(f.fee_amount)}</p>
        {!settled ? (
          <button
            type="button"
            className="btn btn-primary my-fee-pay"
            disabled={paying !== null}
            onClick={() => void pay(f.id)}
          >
            {paying === f.id ? 'Przekierowanie…' : `Zapłać ${formatPln(f.fee_amount)}`}
          </button>
        ) : f.status === 'paid' && f.paid_at ? (
          <p className="my-card-body my-fee-paid-on">Opłacono {new Date(f.paid_at).toLocaleDateString('pl-PL')}</p>
        ) : null}
      </article>
    )
  }

  if (!user) {
    return (
      <div className="container page">
        <p>
          <Link to="/login">Zaloguj się</Link>, żeby zobaczyć opłaty.
        </p>
      </div>
    )
  }

  return (
    <div className="container page">
      <Link to="/my" className="my-back-link">
        ← Panel Moje
      </Link>
      <div className="page-head-row">
        <h1>Opłaty</h1>
      </div>

      <p className="muted my-section-count">
        Niskie prowizje: 3–5% (min. 2 zł). Każda sprzedaż na osobnym kafelku — opłacisz ją kartą przez Stripe.
      </p>

      {returnedPaid &&
        (confirmed ? (
          <p className="success my-fee-notice" role="status">
            Dziękujemy — prowizja opłacona.
          </p>
        ) : (
          <p className="muted my-fee-notice" role="status">
            Płatność przyjęta, czekamy na potwierdzenie ze Stripe…
          </p>
        ))}
      {returnedCancelled && !returnedPaid && (
        <p className="muted my-fee-notice" role="status">
          Płatność przerwana — prowizja nadal czeka na opłacenie.
        </p>
      )}
      {payError && (
        <p className="error my-fee-notice" role="alert">
          {payError}
        </p>
      )}

      {allCount > 0 && pendingTotal > 0 && (
        <div className="my-fee-summary">
          <div>
            <p className="my-card-kicker">Do zapłaty</p>
            <p className="my-fee-summary-amount">{formatPln(pendingTotal)}</p>
          </div>
          <p className="muted">
            {pendingCount} {plural(pendingCount)} oczekujących
          </p>
        </div>
      )}

      {allCount > 0 && (
        <form className="card-filters" aria-label="Filtry opłat" onSubmit={(e) => e.preventDefault()}>
          <div className="filters my-fee-status-filter" role="group" aria-label="Status">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                type="button"
                className={`chip${status === s.value ? ' active' : ''}`}
                aria-pressed={status === s.value}
                onClick={() => setParam({ status: s.value })}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="filter-row">
            <label className="filter-field">
              Tytuł aukcji
              <input type="search" value={search} placeholder="np. telewizor" onChange={(e) => setSearch(e.target.value)} />
            </label>
            <label className="filter-field filter-field-narrow my-fee-date">
              Sprzedaż od
              <input type="date" value={from} max={to || undefined} onChange={(e) => setParam({ from: e.target.value })} />
            </label>
            <label className="filter-field filter-field-narrow my-fee-date">
              do
              <input type="date" value={to} min={from || undefined} onChange={(e) => setParam({ to: e.target.value })} />
            </label>
            {filtered && (
              <button type="button" className="btn btn-outline filter-clear" onClick={clearFilters}>
                Wyczyść filtry
              </button>
            )}
          </div>
        </form>
      )}

      {loading && allCount === 0 ? (
        <p className="muted">Ładowanie…</p>
      ) : allCount === 0 ? (
        <div className="empty">
          <h2>Brak opłat</h2>
          <p>Prowizja pojawia się dopiero po sprzedaży.</p>
          <Link to="/my/selling" className="btn btn-outline">
            Moje aukcje
          </Link>
        </div>
      ) : pendingFees.length === 0 && settledTotal === 0 ? (
        <div className="empty">
          <h2>Nic nie pasuje do filtrów</h2>
          <button type="button" className="btn btn-outline" onClick={clearFilters}>
            Wyczyść filtry
          </button>
        </div>
      ) : (
        <div className={loading ? 'my-fee-loading' : undefined}>
          {pendingFees.length > 0 && (
            <section className="my-fee-section" aria-labelledby="fees-pending">
              <h2 id="fees-pending" className="my-fee-section-title">
                Do zapłaty <span className="muted">· {pendingFees.length}</span>
              </h2>
              <div className="my-card-grid">{pendingFees.map(feeCard)}</div>
            </section>
          )}

          {settledTotal > 0 && (
            <section className="my-fee-section my-fee-section-settled" aria-labelledby="fees-settled">
              <h2 id="fees-settled" className="my-fee-section-title">
                {status === 'paid' ? 'Opłacone' : 'Opłacone i rozliczone'}{' '}
                <span className="muted">
                  · {settledTotal} {plural(settledTotal)}
                  {pageCount > 1 ? ` · strona ${page}/${pageCount}` : ''}
                </span>
              </h2>
              <div className="my-card-grid">{settledFees.map(feeCard)}</div>
              {pageCount > 1 && (
                <Pagination page={page} pageCount={pageCount} onChange={goPage} label="Strony opłat" />
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
