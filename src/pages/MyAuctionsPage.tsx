import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuctionCard } from '../components/AuctionCard'
import { useAuth } from '../lib/auth'
import type { Auction, SellerFee } from '../lib/database.types'
import { formatPln } from '../lib/format'
import { supabase } from '../lib/supabase'

type FeeRow = SellerFee & { auction?: { title: string } | null }

export function MyAuctionsPage() {
  const { user } = useAuth()
  const [selling, setSelling] = useState<Auction[]>([])
  const [bidding, setBidding] = useState<Auction[]>([])
  const [fees, setFees] = useState<FeeRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      await supabase.rpc('close_expired_auctions')

      const { data: mine } = await supabase
        .from('auctions')
        .select('*, category:categories(*)')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })
      setSelling((mine as Auction[]) ?? [])

      const { data: myBids } = await supabase.from('bids').select('auction_id').eq('bidder_id', user!.id)
      const ids = [...new Set((myBids ?? []).map((b: { auction_id: string }) => b.auction_id))]
      if (ids.length) {
        const { data: auctions } = await supabase
          .from('auctions')
          .select('*, category:categories(*)')
          .in('id', ids)
          .order('ends_at', { ascending: true })
        setBidding((auctions as Auction[]) ?? [])
      } else {
        setBidding([])
      }

      const { data: feeRows } = await supabase
        .from('seller_fees')
        .select('*, auction:auctions(title)')
        .eq('seller_id', user!.id)
        .order('created_at', { ascending: false })
      setFees((feeRows as FeeRow[]) ?? [])

      setLoading(false)
    }
    void load()
  }, [user])

  const pendingTotal = useMemo(
    () => fees.filter((f) => f.status === 'pending').reduce((sum, f) => sum + Number(f.fee_amount), 0),
    [fees],
  )

  if (!user) {
    return (
      <div className="container page">
        <p>
          <Link to="/logowanie">Zaloguj się</Link>, żeby zobaczyć swoje aukcje.
        </p>
      </div>
    )
  }

  return (
    <div className="container page">
      <h1>Moje aukcje</h1>
      {loading && <p className="muted">Ładowanie…</p>}

      <section className="section-block">
        <h2>Prowizje od sprzedaży</h2>
        {fees.length === 0 ? (
          <p className="muted">Brak naliczonych opłat — prowizja pojawia się dopiero po sprzedaży.</p>
        ) : (
          <>
            {pendingTotal > 0 && (
              <p className="fee-due">
                Do zapłaty: <strong>{formatPln(pendingTotal)}</strong>
              </p>
            )}
            <ul className="fee-list">
              {fees.map((f) => (
                <li key={f.id}>
                  <div>
                    <strong>{f.auction?.title || 'Aukcja'}</strong>
                    <span className="muted">
                      {' '}
                      · sprzedaż {formatPln(f.sale_price)} · {Number(f.fee_percent)}%
                    </span>
                  </div>
                  <div className="fee-list-right">
                    <strong>{formatPln(f.fee_amount)}</strong>
                    <span className={`fee-status ${f.status}`}>{f.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="section-block">
        <h2>Wystawiam</h2>
        {selling.length === 0 ? (
          <p className="muted">
            Nic jeszcze nie wystawiłeś. <Link to="/wystaw">Wystaw pierwszą aukcję</Link>
          </p>
        ) : (
          <div className="selling-list">
            {selling.map((a) => (
              <div key={a.id} className="selling-item">
                <AuctionCard auction={a} />
                {a.status === 'active' && (
                  <Link to={`/aukcja/${a.id}/edycja`} className="btn btn-outline btn-sm selling-edit">
                    Edytuj
                  </Link>
                )}
                {a.status === 'sold' && (
                  <Link to={`/aukcja/${a.id}`} className="btn btn-outline btn-sm selling-edit">
                    Chat z kupującym
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="section-block">
        <h2>Licytuję</h2>
        {bidding.length === 0 ? (
          <p className="muted">Nie bierzesz udziału w żadnej aukcji.</p>
        ) : (
          <div className="selling-list">
            {bidding.map((a) => (
              <div key={a.id} className="selling-item">
                <AuctionCard auction={a} />
                {a.status === 'sold' && a.winner_id === user.id && (
                  <Link to={`/aukcja/${a.id}`} className="btn btn-outline btn-sm selling-edit">
                    Chat ze sprzedawcą
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
