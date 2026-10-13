import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuctionCard } from '../components/AuctionCard'
import { Pagination } from '../components/Pagination'
import { useAuth } from '../lib/auth'
import type { Auction } from '../lib/database.types'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 12

export function MyBiddingPage() {
  const { user } = useAuth()
  const [bidding, setBidding] = useState<Auction[]>([])
  const [bidAuctionIds, setBidAuctionIds] = useState<string[]>([])
  const [biddingTotal, setBiddingTotal] = useState(0)
  const [biddingPage, setBiddingPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const biddingPageCount = Math.max(1, Math.ceil(biddingTotal / PAGE_SIZE))

  useEffect(() => {
    if (!user) return
    async function loadIds() {
      setLoading(true)
      await supabase.rpc('close_expired_auctions')
      const { data: myBids } = await supabase.from('bids').select('auction_id').eq('bidder_id', user!.id)
      const ids = [...new Set((myBids ?? []).map((b: { auction_id: string }) => b.auction_id))]
      setBidAuctionIds(ids)
      setBiddingTotal(ids.length)
      setBiddingPage(1)
      setLoading(false)
    }
    void loadIds()
  }, [user])

  useEffect(() => {
    if (!user) return
    async function loadBidding() {
      if (bidAuctionIds.length === 0) {
        setBidding([])
        return
      }
      setLoading(true)
      const from = (biddingPage - 1) * PAGE_SIZE
      const pageIds = bidAuctionIds.slice(from, from + PAGE_SIZE)
      if (!pageIds.length) {
        setBidding([])
        setLoading(false)
        return
      }
      const { data: auctions } = await supabase
        .from('auctions')
        .select('*, category:categories(*)')
        .in('id', pageIds)
      const byId = new Map(((auctions as Auction[]) ?? []).map((a) => [a.id, a]))
      setBidding(pageIds.map((id) => byId.get(id)).filter(Boolean) as Auction[])
      setLoading(false)
    }
    void loadBidding()
  }, [user, biddingPage, bidAuctionIds])

  function goBiddingPage(p: number) {
    setBiddingPage(Math.min(Math.max(1, p), biddingPageCount))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!user) {
    return (
      <div className="container page">
        <p>
          <Link to="/login">Zaloguj się</Link>, żeby zobaczyć licytacje.
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
        <h1>Licytuję</h1>
        <div className="page-head-actions">
          <Link to="/auctions" className="btn btn-outline">
            Przeglądaj aukcje
          </Link>
        </div>
      </div>

      {biddingTotal > 0 && (
        <p className="muted my-section-count">
          {biddingTotal} {biddingTotal === 1 ? 'aukcja' : biddingTotal < 5 ? 'aukcje' : 'aukcji'}
          {biddingPageCount > 1 ? ` · strona ${biddingPage}/${biddingPageCount}` : ''}
        </p>
      )}

      {loading ? (
        <p className="muted">Ładowanie…</p>
      ) : bidding.length === 0 ? (
        <p className="muted">Nie bierzesz udziału w żadnej aukcji.</p>
      ) : (
        <>
          <div className="selling-list">
            {bidding.map((a) => (
              <div key={a.id} className="selling-item">
                <AuctionCard auction={a} />
                {a.status === 'sold' && a.winner_id === user.id && (
                  <Link to={`/auction/${a.id}`} className="btn btn-outline btn-sm selling-edit">
                    Chat ze sprzedawcą
                  </Link>
                )}
              </div>
            ))}
          </div>
          <Pagination
            page={biddingPage}
            pageCount={biddingPageCount}
            onChange={goBiddingPage}
            label="Strony licytowanych aukcji"
          />
        </>
      )}
    </div>
  )
}
