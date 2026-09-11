import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { useAuth } from '../lib/auth'
import type { Auction, Bid } from '../lib/database.types'
import { formatPln, formatRemaining, minNextBid } from '../lib/format'
import { supabase } from '../lib/supabase'

export function AuctionDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [amount, setAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [useProxy, setUseProxy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [buyNowOpen, setBuyNowOpen] = useState(false)
  const [buyNowError, setBuyNowError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [chatBusy, setChatBusy] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  async function load() {
    if (!id) return
    await supabase.rpc('close_expired_auctions')
    const { data: a, error: aErr } = await supabase
      .from('auctions')
      .select('*, category:categories(*), seller:profiles!auctions_seller_id_fkey(*)')
      .eq('id', id)
      .single()
    if (aErr) {
      setError(aErr.message)
      return
    }
    setAuction(a as Auction)
    setActiveImage(0)

    const { data: b } = await supabase
      .from('bids')
      .select('*, bidder:profiles!bids_bidder_id_fkey(*)')
      .eq('auction_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
    setBids((b as Bid[]) ?? [])

    const auctionRow = a as Auction
    const min = minNextBid(
      Number(auctionRow.current_price),
      Number(auctionRow.starting_price),
      Number(auctionRow.bid_increment),
      Number(auctionRow.bid_count),
    )
    setAmount(String(min))
  }

  useEffect(() => {
    void load()
    if (!id) return
    const channel = supabase
      .channel(`auction-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auctions', filter: `id=eq.${id}` },
        () => void load(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `auction_id=eq.${id}` },
        () => void load(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id])

  const live = useMemo(
    () => auction?.status === 'active' && new Date(auction.ends_at).getTime() > now,
    [auction, now],
  )

  const isSeller = !!user && auction?.seller_id === user.id
  const isWinner = !!user && auction?.winner_id === user.id
  const canChat = auction?.status === 'sold' && (isSeller || isWinner)

  async function openChat() {
    if (!id || !user) {
      navigate('/logowanie')
      return
    }
    setChatBusy(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.rpc('get_or_create_conversation', {
        p_auction_id: id,
      })
      if (err) throw err
      const conv = data as { id: string }
      navigate(`/wiadomosci/${conv.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się otworzyć czatu')
    } finally {
      setChatBusy(false)
    }
  }

  async function placeBid(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      navigate('/logowanie')
      return
    }
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      const { error: err } = await supabase.rpc('place_bid', {
        p_auction_id: id,
        p_amount: Number(amount),
        p_max_amount: useProxy && maxAmount ? Number(maxAmount) : null,
      })
      if (err) throw err
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się złożyć oferty')
    } finally {
      setBusy(false)
    }
  }

  function openBuyNow() {
    if (!user) {
      navigate('/logowanie')
      return
    }
    setBuyNowError(null)
    setBuyNowOpen(true)
  }

  async function confirmBuyNow() {
    if (!id || !auction?.buy_now_price) return
    setBusy(true)
    setBuyNowError(null)
    try {
      const { error: err } = await supabase.rpc('buy_now', { p_auction_id: id })
      if (err) throw err
      setBuyNowOpen(false)
      await load()
    } catch (err) {
      setBuyNowError(err instanceof Error ? err.message : 'Nie udało się kupić')
    } finally {
      setBusy(false)
    }
  }

  if (!auction) {
    return (
      <div className="container page">
        <p className="muted">{error || 'Ładowanie…'}</p>
      </div>
    )
  }

  const images = auction.image_urls?.filter(Boolean) ?? []
  const img = images[Math.min(activeImage, Math.max(images.length - 1, 0))]

  return (
    <div className="container page detail">
      <Link to="/aukcje" className="back">
        ← Wróć do aukcji
      </Link>
      <div className="detail-grid">
        <div className="detail-media">
          {img ? <img src={img} alt={auction.title} /> : <div className="auction-card-placeholder">Brak zdjęcia</div>}
          {images.length > 1 && (
            <div className="detail-thumbs" role="listbox" aria-label="Zdjęcia aukcji">
              {images.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  role="option"
                  aria-selected={i === activeImage}
                  className={i === activeImage ? 'detail-thumb active' : 'detail-thumb'}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={url} alt={`Zdjęcie ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-panel">
          <div className="detail-top">
            {live ? <span className="live-pill">● Na żywo</span> : <span className="ended-pill">{auction.status}</span>}
            <span className="timer big">{formatRemaining(auction.ends_at, now)}</span>
          </div>
          <h1>{auction.title}</h1>
          <p className="meta">
            {auction.city || 'Polska'}
            {auction.category?.name ? ` · ${auction.category.name}` : ''}
            {auction.seller?.display_name ? ` · sprzedaje ${auction.seller.display_name}` : ''}
          </p>
          {isSeller && live && (
            <div className="seller-actions">
              <Link to={`/aukcja/${auction.id}/edycja`} className="btn btn-outline">
                Edytuj ofertę
              </Link>
            </div>
          )}
          <div className="price-block">
            <span className="label">Aktualna oferta</span>
            <strong className="price huge">{formatPln(auction.current_price)}</strong>
            <span className="muted">
              Start {formatPln(auction.starting_price)} · krok {formatPln(auction.bid_increment)} · {auction.bid_count}{' '}
              ofert
            </span>
            {auction.reserve_price != null && (
              <span className="muted">Minimum sprzedawcy: {formatPln(auction.reserve_price)}</span>
            )}
            {auction.buy_now_price != null && (
              <span className="muted">Kup teraz: {formatPln(auction.buy_now_price)}</span>
            )}
          </div>

          {live && isSeller && (
            <p className="hint">To Twoja aukcja — możesz dodać lub zmienić „Kup teraz” w edycji oferty.</p>
          )}

          {live && !isSeller && (
            <form className="bid-form" onSubmit={placeBid}>
              <label>
                Twoja oferta (zł)
                <input
                  type="number"
                  min={0}
                  step="1"
                  required={!useProxy}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={useProxy}
                />
              </label>
              <label className="checkbox">
                <input type="checkbox" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
                Limit maksymalny (auto-bid do Twojego max)
              </label>
              {useProxy && (
                <label>
                  Max, ile chcesz zapłacić
                  <input
                    type="number"
                    min={0}
                    step="1"
                    required
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </label>
              )}
              {error && <p className="error">{error}</p>}
              <button className="btn btn-primary btn-lg" disabled={busy} type="submit">
                {busy ? 'Składanie…' : 'Licytuj'}
              </button>
              {auction.buy_now_price && (
                <button className="btn btn-outline btn-lg" type="button" disabled={busy} onClick={openBuyNow}>
                  Kup teraz · {formatPln(auction.buy_now_price)}
                </button>
              )}
              <p className="hint">Oferta w ostatnich 3 minutach przedłuża aukcję o 3 minuty.</p>
            </form>
          )}

          {!live && auction.status === 'sold' && (
            <div className="sold-box">
              <p className="success">
                Sprzedane
                {isWinner ? ' — wygrałeś!' : isSeller ? ' — Twój przedmiot znalazł nabywcę.' : '.'}
              </p>
              {canChat && (
                <button type="button" className="btn btn-primary" disabled={chatBusy} onClick={() => void openChat()}>
                  {chatBusy ? 'Otwieranie…' : isSeller ? 'Napisz do kupującego' : 'Napisz do sprzedawcy'}
                </button>
              )}
              {!user && <p className="hint">Zaloguj się, żeby napisać po zakupie.</p>}
            </div>
          )}
        </div>
      </div>

      <section className="section-block">
        <h2>Opis</h2>
        <p className="description">{auction.description || 'Brak opisu.'}</p>
        <p className="muted">Dostawa: {auction.shipping_options?.join(', ') || 'do uzgodnienia'}</p>
      </section>

      <section className="section-block">
        <h2>Historia ofert</h2>
        {bids.length === 0 ? (
          <p className="muted">Brak ofert — bądź pierwszy.</p>
        ) : (
          <ul className="bid-list">
            {bids.map((b) => (
              <li key={b.id}>
                <strong>{formatPln(b.amount)}</strong>
                <span>{b.bidder?.display_name || 'Użytkownik'}</span>
                <time>{new Date(b.created_at).toLocaleString('pl-PL')}</time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={buyNowOpen} title="Kup teraz" onClose={() => !busy && setBuyNowOpen(false)}>
        <div className="buy-now-modal">
          {img && (
            <div className="buy-now-thumb">
              <img src={img} alt="" />
            </div>
          )}
          <div className="buy-now-info">
            <h3>{auction.title}</h3>
            <p className="muted">Aukcja zakończy się natychmiast. Kupujesz za stałą cenę.</p>
            <div className="buy-now-price">
              <span className="label">Do zapłaty</span>
              <strong>{formatPln(auction.buy_now_price)}</strong>
            </div>
            {buyNowError && <p className="error">{buyNowError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setBuyNowOpen(false)}>
                Anuluj
              </button>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void confirmBuyNow()}>
                {busy ? 'Kupowanie…' : `Potwierdź · ${formatPln(auction.buy_now_price)}`}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
