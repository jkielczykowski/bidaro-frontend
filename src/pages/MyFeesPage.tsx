import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pagination } from '../components/Pagination'
import { useAuth } from '../lib/auth'
import { ApiError, startFeeCheckout } from '../lib/bidigoApi'
import type { SellerFee } from '../lib/database.types'
import { formatPln } from '../lib/format'
import { supabase } from '../lib/supabase'

type FeeRow = SellerFee & { auction?: { title: string } | null }

const PAGE_SIZE = 12

const STATUS_LABEL: Record<SellerFee['status'], string> = {
  pending: 'Do zapłaty',
  paid: 'Opłacona',
  cancelled: 'Anulowana',
  waived: 'Umorzona',
}

export function MyFeesPage() {
  const { user } = useAuth()
  const [fees, setFees] = useState<FeeRow[]>([])
  const [total, setTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  // Stripe Checkout sends the seller back here with ?paid=<fee id> or ?cancelled=<fee id>
  const [params] = useSearchParams()
  const returnedPaid = params.get('paid')
  const returnedCancelled = params.get('cancelled')

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: pendingRows }, pageRes] = await Promise.all([
      supabase
        .from('seller_fees')
        .select('fee_amount, status')
        .eq('seller_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('seller_fees')
        .select('*, auction:auctions(title)', { count: 'exact' })
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    ])

    const pending = (pendingRows ?? []) as { fee_amount: number }[]
    setPendingCount(pending.length)
    setPendingTotal(pending.reduce((s, f) => s + Number(f.fee_amount), 0))
    setFees((pageRes.data as FeeRow[]) ?? [])
    setTotal(pageRes.count ?? 0)
    setLoading(false)
  }, [user, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

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
    setPage(Math.min(Math.max(1, p), pageCount))
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

      {loading ? (
        <p className="muted">Ładowanie…</p>
      ) : total === 0 ? (
        <div className="empty">
          <h2>Brak opłat</h2>
          <p>Prowizja pojawia się dopiero po sprzedaży.</p>
          <Link to="/my/selling" className="btn btn-outline">
            Moje aukcje
          </Link>
        </div>
      ) : (
        <>
          {pendingTotal > 0 && (
            <div className="my-fee-summary">
              <div>
                <p className="my-card-kicker">Do zapłaty</p>
                <p className="my-fee-summary-amount">{formatPln(pendingTotal)}</p>
              </div>
              <p className="muted">
                {pendingCount} {pendingCount === 1 ? 'pozycja' : pendingCount < 5 ? 'pozycje' : 'pozycji'}{' '}
                oczekujących
              </p>
            </div>
          )}

          <p className="muted notif-count">
            {total} {total === 1 ? 'pozycja' : total < 5 ? 'pozycje' : 'pozycji'}
            {pageCount > 1 ? ` · strona ${page}/${pageCount}` : ''}
          </p>

          <div className="my-card-grid">
            {fees.map((f) => (
              <article key={f.id} className={`my-card${f.status === 'pending' ? ' my-card-warn' : ''}`}>
                <div className="my-card-top">
                  <p className="my-card-kicker">
                    {new Date(f.created_at).toLocaleDateString('pl-PL')}
                  </p>
                  <span className={`fee-status ${f.status}`}>{STATUS_LABEL[f.status] ?? f.status}</span>
                </div>
                <h2 className="my-card-title">{f.auction?.title || 'Aukcja'}</h2>
                <p className="my-card-body muted">
                  Sprzedaż {formatPln(f.sale_price)} · prowizja {Number(f.fee_percent)}%
                </p>
                <p className="my-fee-amount">{formatPln(f.fee_amount)}</p>
                {f.status === 'pending' ? (
                  <button
                    type="button"
                    className="btn btn-primary my-fee-pay"
                    disabled={paying !== null}
                    onClick={() => void pay(f.id)}
                  >
                    {paying === f.id ? 'Przekierowanie…' : `Zapłać ${formatPln(f.fee_amount)}`}
                  </button>
                ) : f.status === 'paid' && f.paid_at ? (
                  <p className="my-card-body muted">Opłacono {new Date(f.paid_at).toLocaleDateString('pl-PL')}</p>
                ) : null}
              </article>
            ))}
          </div>

          <Pagination page={page} pageCount={pageCount} onChange={goPage} label="Strony opłat" />
        </>
      )}
    </div>
  )
}
