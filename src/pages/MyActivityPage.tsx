import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pagination } from '../components/Pagination'
import { useAuth } from '../lib/auth'
import { formatPln } from '../lib/format'
import { supabase } from '../lib/supabase'

type BidActivity = {
  id?: string
  auction_id: string
  amount: number
  created_at: string
  bidder?: { display_name: string | null } | null
  auction?: { title: string } | null
}

const PAGE_SIZE = 12

export function MyActivityPage() {
  const { user } = useAuth()
  const [activity, setActivity] = useState<BidActivity[]>([])
  const [auctionIds, setAuctionIds] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    if (!user) return
    async function loadIds() {
      const { data: sellIds } = await supabase.from('auctions').select('id').eq('seller_id', user!.id)
      const ids = (sellIds ?? []).map((r: { id: string }) => r.id)
      setAuctionIds(ids)
      setPage(1)

      if (!ids.length) {
        setTotal(0)
        setActivity([])
        setLoading(false)
        return
      }

      const { count } = await supabase
        .from('bids')
        .select('id', { count: 'exact', head: true })
        .in('auction_id', ids.slice(0, 500))
      setTotal(count ?? 0)
    }
    void loadIds()
  }, [user])

  const loadPage = useCallback(async () => {
    if (!user) return
    if (auctionIds.length === 0) {
      setActivity([])
      setLoading(false)
      return
    }
    setLoading(true)
    const from = (page - 1) * PAGE_SIZE
    const { data: bids2 } = await supabase
      .from('bids')
      .select(
        'id, auction_id, amount, created_at, bidder:profiles!bids_bidder_id_fkey(display_name), auction:auctions!bids_auction_id_fkey(title)',
      )
      .in('auction_id', auctionIds.slice(0, 500))
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    setActivity(
      ((bids2 as unknown as BidActivity[]) ?? []).map((b) => ({
        ...b,
        bidder: Array.isArray(b.bidder) ? b.bidder[0] ?? null : b.bidder,
        auction: Array.isArray(b.auction) ? b.auction[0] ?? null : b.auction,
      })),
    )
    setLoading(false)
  }, [user, auctionIds, page])

  useEffect(() => {
    void loadPage()
  }, [loadPage])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  function goPage(p: number) {
    setPage(Math.min(Math.max(1, p), pageCount))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) {
    return (
      <div className="container page">
        <p>
          <Link to="/login">Zaloguj się</Link>, żeby zobaczyć aktywność.
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
        <h1>Aktywność</h1>
        <div className="page-head-actions">
          <Link to="/notifications" className="btn btn-outline">
            Powiadomienia
          </Link>
        </div>
      </div>

      <p className="muted my-section-count">Oferty złożone na Twoje aukcje — osobna zakładka, ze stronicowaniem.</p>

      {loading ? (
        <p className="muted">Ładowanie…</p>
      ) : total === 0 ? (
        <div className="empty">
          <h2>Jeszcze cicho</h2>
          <p>Jak ktoś złoży ofertę — zobaczysz to tutaj.</p>
          <Link to="/my/selling" className="btn btn-outline">
            Moje aukcje
          </Link>
        </div>
      ) : (
        <>
          <p className="muted notif-count">
            {total} {total === 1 ? 'oferta' : total < 5 ? 'oferty' : 'ofert'}
            {pageCount > 1 ? ` · strona ${page}/${pageCount}` : ''}
          </p>
          <div className="my-card-grid">
            {activity.map((b, i) => (
              <article key={b.id || `${b.auction_id}-${b.created_at}-${i}`} className="my-card">
                <p className="my-card-kicker">{new Date(b.created_at).toLocaleString('pl-PL')}</p>
                <h2 className="my-card-title">
                  <strong>{b.bidder?.display_name || 'Ktoś'}</strong>
                  <span className="muted"> podbił do </span>
                  {formatPln(b.amount)}
                </h2>
                <p className="my-card-body">
                  <Link to={`/auction/${b.auction_id}`}>{b.auction?.title || 'Aukcja'}</Link>
                </p>
                <Link to={`/auction/${b.auction_id}`} className="btn btn-outline btn-sm">
                  Zobacz aukcję
                </Link>
              </article>
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={goPage} label="Strony aktywności" />
        </>
      )}
    </div>
  )
}
