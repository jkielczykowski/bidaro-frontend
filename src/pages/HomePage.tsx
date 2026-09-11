import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuctionCard } from '../components/AuctionCard'
import { SearchBar } from '../components/SearchBar'
import type { Auction, Category } from '../lib/database.types'
import { supabase } from '../lib/supabase'

export function HomePage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const category = params.get('kat') || 'all'

  const [auctions, setAuctions] = useState<Auction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tops = useMemo(() => categories.filter((c) => !c.parent_id), [categories])

  const activeParent = useMemo(() => {
    if (category === 'all') return null
    const current = categories.find((c) => c.id === category)
    if (!current) return null
    if (!current.parent_id) return current.id
    return current.parent_id
  }, [categories, category])

  const subcats = useMemo(() => {
    if (!activeParent) return []
    return categories.filter((c) => c.parent_id === activeParent)
  }, [categories, activeParent])

  useEffect(() => {
    void supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function enrich(ids: string[]) {
      if (ids.length === 0) return [] as Auction[]
      const { data: full } = await supabase
        .from('auctions')
        .select('*, category:categories(*), seller:profiles!auctions_seller_id_fkey(*)')
        .in('id', ids)
      const byId = new Map(((full as Auction[]) ?? []).map((a) => [a.id, a]))
      return ids.map((id) => byId.get(id)).filter(Boolean) as Auction[]
    }

    async function load() {
      setLoading(true)
      setError(null)
      await supabase.rpc('close_expired_auctions')

      const cat = category === 'all' ? null : category
      const { data, error: err } = await supabase.rpc('search_auctions', {
        p_query: q || null,
        p_category_id: cat,
        p_status: 'active',
        p_limit: 48,
        p_offset: 0,
      })

      if (cancelled) return
      if (err) {
        setError(err.message)
        setAuctions([])
      } else {
        const rows = (data as Auction[]) ?? []
        setAuctions(await enrich(rows.map((r) => r.id)))
      }
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [q, category])

  function setCategory(id: string) {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('kat')
    else next.set('kat', id)
    setParams(next)
  }

  return (
    <div className="container page">
      <section className="page-hero auctions-hero">
        <div>
          <h1>
            Aukcje
            <span> na żywo</span>
          </h1>
          <p>Szukaj po tytule, opisie, mieście — albo wybierz kategorię.</p>
        </div>
        <SearchBar initialQuery={q} />
      </section>

      <div className="filters">
        <button type="button" className={category === 'all' ? 'chip active' : 'chip'} onClick={() => setCategory('all')}>
          Wszystkie
        </button>
        {tops.map((c) => (
          <button
            key={c.id}
            type="button"
            className={activeParent === c.id || category === c.id ? 'chip active' : 'chip'}
            onClick={() => setCategory(c.id)}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {subcats.length > 0 && (
        <div className="filters subfilters">
          {subcats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={category === c.id ? 'chip active' : 'chip'}
              onClick={() => setCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {(q || category !== 'all') && (
        <p className="muted search-meta">
          {q ? (
            <>
              Wyniki dla <strong>„{q}”</strong>
            </>
          ) : (
            'Filtrowanie kategorii'
          )}
          {' · '}
          <Link
            to="/aukcje"
            onClick={(e) => {
              e.preventDefault()
              setParams({})
            }}
          >
            Wyczyść
          </Link>
        </p>
      )}

      {loading && <p className="muted">Szukam…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && auctions.length === 0 && (
        <div className="empty">
          <h2>Nic nie znaleziono</h2>
          <p>Spróbuj innego hasła albo wystaw własną aukcję.</p>
          <Link to="/wystaw" className="btn btn-primary">
            Wystaw aukcję
          </Link>
        </div>
      )}
      <div className="auction-grid">
        {auctions.map((a) => (
          <AuctionCard key={a.id} auction={a} />
        ))}
      </div>
    </div>
  )
}
