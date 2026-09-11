import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Auction } from '../lib/database.types'
import { formatPln, formatRemaining } from '../lib/format'

export function AuctionCard({ auction }: { auction: Auction }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const img = auction.image_urls?.[0]
  const live = auction.status === 'active' && new Date(auction.ends_at).getTime() > now

  return (
    <Link to={`/aukcja/${auction.id}`} className="auction-card">
      <div className="auction-card-media">
        {img ? (
          <img src={img} alt="" loading="lazy" />
        ) : (
          <div className="auction-card-placeholder">Brak zdjęcia</div>
        )}
        {live && <span className="live-pill">● Na żywo</span>}
      </div>
      <div className="auction-card-body">
        <h3>{auction.title}</h3>
        <p className="meta">
          {auction.city || 'Polska'}
          {auction.category?.name ? ` · ${auction.category.name}` : ''}
        </p>
        <div className="auction-card-footer">
          <div>
            <span className="label">Aktualna oferta</span>
            <strong className="price">{formatPln(auction.current_price)}</strong>
          </div>
          <div className="timer">{formatRemaining(auction.ends_at, now)}</div>
        </div>
      </div>
    </Link>
  )
}
