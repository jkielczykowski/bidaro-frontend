import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuctionCard } from '../components/AuctionCard'
import { SearchBar } from '../components/SearchBar'
import type { Auction } from '../lib/database.types'
import { supabase } from '../lib/supabase'

export function LandingPage() {
  const [featured, setFeatured] = useState<Auction[]>([])

  useEffect(() => {
    void (async () => {
      await supabase.rpc('close_expired_auctions')
      const { data } = await supabase
        .from('auctions')
        .select('*, category:categories(*), seller:profiles!auctions_seller_id_fkey(*)')
        .eq('status', 'active')
        .order('ends_at', { ascending: true })
        .limit(3)
      setFeatured((data as Auction[]) ?? [])
    })()
  }, [])

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="container landing-hero-grid">
          <div className="landing-copy">
            <div className="badge">
              <span className="badge-dot" />
              Polski marketplace z licytacjami
            </div>
            <h1>
              Sprzedaj to, co leży w piwnicy.
              <span> Ktoś to kupi.</span>
            </h1>
            <p>
              Wystawiasz przedmiot, ustawiasz minimalną cenę i czas licytacji. Kupujący bidują — po
              wygranej dogadujecie odbiór.
            </p>
            <SearchBar className="landing-search" />
            <div className="landing-cta">
              <Link to="/aukcje" className="btn btn-primary btn-lg-inline">
                Przeglądaj aukcje
              </Link>
              <Link to="/wystaw" className="btn btn-outline btn-lg-inline">
                Wystaw coś
              </Link>
            </div>
            <div className="landing-stats">
              <div>
                <strong>0 zł</strong>
                <span>prowizji na start</span>
              </div>
              <div>
                <strong>24h</strong>
                <span>min. czas aukcji</span>
              </div>
              <div>
                <strong>Live</strong>
                <span>oferty na żywo</span>
              </div>
            </div>
          </div>

          <div className="landing-visual">
            {featured[0] ? (
              <AuctionCard auction={featured[0]} />
            ) : (
              <div className="landing-card-fallback">
                <span className="live-pill static">● Na żywo</span>
                <h3>Twoja pierwsza aukcja może być tu</h3>
                <p>Rower, telefon, narzędzia — wystaw i niech leci.</p>
                <Link to="/wystaw" className="btn btn-primary">
                  Wystaw teraz
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <div className="section-intro">
            <span className="section-tag">Jak to działa</span>
            <h2>Trzy kroki od piwnicy do kieszeni</h2>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-num">01</span>
              <h3>Wystaw</h3>
              <p>Zdjęcia, opis, cena startowa i czas — np. 3 dni. Opcjonalnie „Kup teraz”.</p>
            </article>
            <article className="step-card">
              <span className="step-num">02</span>
              <h3>Licytuj na żywo</h3>
              <p>Oferty lecą w czasie rzeczywistym. Limit max chroni Cię, gdy nie siedzisz przy ekranie.</p>
            </article>
            <article className="step-card">
              <span className="step-num">03</span>
              <h3>Dogadaj odbiór</h3>
              <p>Po wygranej ustalacie BLIK, gotówkę, paczkomat albo odbiór osobisty.</p>
            </article>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="landing-section muted-bg">
          <div className="container">
            <div className="section-intro row">
              <div>
                <span className="section-tag">Teraz na żywo</span>
                <h2>Gorące aukcje</h2>
              </div>
              <Link to="/aukcje" className="btn btn-outline">
                Zobacz wszystkie
              </Link>
            </div>
            <div className="auction-grid">
              {featured.map((a) => (
                <AuctionCard key={a.id} auction={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="landing-cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2>Masz coś do sprzedania?</h2>
            <p>Wystaw w 2 minuty. Zero prowizji na starcie.</p>
          </div>
          <Link to="/wystaw" className="btn btn-dark btn-lg-inline">
            Wystaw aukcję
          </Link>
        </div>
      </section>
    </div>
  )
}
