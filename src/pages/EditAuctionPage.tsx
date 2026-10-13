import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CitySuggest } from '../components/CitySuggest'
import { ImageCropDialog } from '../components/ImageCropDialog'
import { useAuth } from '../lib/auth'
import type { Auction } from '../lib/database.types'
import { formatPln } from '../lib/format'
import { newId } from '../lib/id'
import { supabase } from '../lib/supabase'

const MAX_PHOTOS = 5

type PhotoItem =
  | { id: string; kind: 'remote'; url: string }
  | { id: string; kind: 'local'; file: File; previewUrl: string }

type FieldErrors = {
  title?: string
  description?: string
  city?: string
  photos?: string
  buyNowPrice?: string
  shipping?: string
}

export function EditAuctionPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [auction, setAuction] = useState<Auction | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [buyNowPrice, setBuyNowPrice] = useState('')
  const [shipping, setShipping] = useState<string[]>(['odbior'])
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  useEffect(() => {
    if (!id || !user) return
    void (async () => {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', id)
        .single()
      if (err || !data) {
        setError(err?.message || 'Nie znaleziono aukcji')
        setLoading(false)
        return
      }
      const a = data as Auction
      if (a.seller_id !== user.id) {
        setError('Możesz edytować tylko własne oferty')
        setLoading(false)
        return
      }
      if (a.status !== 'active') {
        setError('Edycja tylko aktywnych aukcji')
        setLoading(false)
        return
      }
      setAuction(a)
      setTitle(a.title)
      setDescription(a.description || '')
      setCity(a.city || '')
      setBuyNowPrice(a.buy_now_price != null ? String(a.buy_now_price) : '')
      setShipping(a.shipping_options?.length ? a.shipping_options : ['odbior'])
      setPhotos((a.image_urls || []).map((url) => ({ id: newId(), kind: 'remote' as const, url })))
      setLoading(false)
    })()
  }, [id, user, navigate])

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc)
    }
  }, [cropSrc])

  useEffect(() => {
    return () => {
      photos.forEach((p) => {
        if (p.kind === 'local') URL.revokeObjectURL(p.previewUrl)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, [])

  const minBuyNow = useMemo(() => {
    if (!auction) return 1
    return Math.max(Number(auction.current_price), Number(auction.starting_price)) + 0.01
  }, [auction])

  function toggleShipping(opt: string) {
    setShipping((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]))
    setFieldErrors((e) => ({ ...e, shipping: undefined }))
  }

  function onPickFile(picked: File | null) {
    if (!picked) return
    if (photos.length >= MAX_PHOTOS) {
      setFieldErrors((e) => ({ ...e, photos: `Maksimum ${MAX_PHOTOS} zdjęć` }))
      return
    }
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(URL.createObjectURL(picked))
    setCropOpen(true)
  }

  function onCropCancel() {
    setCropOpen(false)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function onCropConfirm(cropped: File) {
    const previewUrl = URL.createObjectURL(cropped)
    setPhotos((prev) => {
      if (prev.length >= MAX_PHOTOS) {
        URL.revokeObjectURL(previewUrl)
        return prev
      }
      return [...prev, { id: newId(), kind: 'local', file: cropped, previewUrl }]
    })
    setFieldErrors((e) => ({ ...e, photos: undefined }))
    setCropOpen(false)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function removePhoto(pid: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === pid)
      if (target?.kind === 'local') URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== pid)
    })
  }

  function movePhoto(pid: string, dir: -1 | 1) {
    setPhotos((prev) => {
      const i = prev.findIndex((p) => p.id === pid)
      if (i < 0) return prev
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!title.trim() || title.trim().length < 5) errs.title = 'Podaj tytuł (min. 5 znaków)'
    if (!description.trim() || description.trim().length < 5) errs.description = 'Opis jest wymagany (min. 5 znaków)'
    if (!city.trim() || city.trim().length < 2) errs.city = 'Podaj miasto'
    if (photos.length < 1) errs.photos = 'Dodaj co najmniej 1 zdjęcie'
    if (shipping.length < 1) errs.shipping = 'Wybierz co najmniej jedną opcję dostawy'
    if (buyNowPrice.trim()) {
      const b = Number(buyNowPrice)
      const floor = Math.max(Number(auction?.current_price ?? 0), Number(auction?.starting_price ?? 0))
      if (Number.isNaN(b) || b <= floor) {
        errs.buyNowPrice = `Kup teraz musi być wyższe od ${formatPln(floor)}`
      }
    }
    return errs
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !id || !auction) return
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length) {
      const first = Object.values(errs)[0]
      setError(first || 'Uzupełnij wymagane pola')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const imageUrls: string[] = []
      for (const photo of photos) {
        if (photo.kind === 'remote') {
          imageUrls.push(photo.url)
          continue
        }
        const path = `${user.id}/${newId()}.jpg`
        const { error: upErr } = await supabase.storage.from('auction-images').upload(path, photo.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('auction-images').getPublicUrl(path)
        imageUrls.push(pub.publicUrl)
      }

      const { data, error: updErr } = await supabase
        .from('auctions')
        .update({
          title: title.trim(),
          description: description.trim(),
          city: city.trim(),
          shipping_options: shipping,
          image_urls: imageUrls,
          buy_now_price: buyNowPrice.trim() ? Number(buyNowPrice) : null,
        })
        .eq('id', id)
        .eq('seller_id', user.id)
        .select('id')
        .maybeSingle()

      if (updErr) throw updErr
      if (!data) throw new Error('Nie zapisano zmian — brak uprawnień lub aukcja nieaktywna')
      navigate(`/auction/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się zapisać zmian')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="container narrow page">
        <p className="muted">Ładowanie…</p>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="container narrow page">
        <p className="error">{error || 'Brak aukcji'}</p>
        <Link to="/my/selling">Wróć do moich aukcji</Link>
      </div>
    )
  }

  return (
    <div className="container narrow page">
      <Link to={`/auction/${id}`} className="back">
        ← Wróć do aukcji
      </Link>
      <h1>Edytuj ofertę</h1>
      <p className="muted">
        Aktualna oferta: {formatPln(auction.current_price)}. Możesz dodać lub zmienić „Kup teraz”.
      </p>

      <form className="card-form" onSubmit={onSubmit} noValidate>
        <div className="edit-buy-now-box">
          <h3>Kup teraz</h3>
          <p className="muted">
            Ustaw stałą cenę — kupujący może zakończyć aukcję od razu. Zostaw puste, żeby wyłączyć.
          </p>
          <label className={fieldErrors.buyNowPrice ? 'has-error' : ''}>
            Cena Kup teraz (zł)
            <input
              type="number"
              min={Math.ceil(minBuyNow)}
              step="1"
              value={buyNowPrice}
              onChange={(e) => {
                setBuyNowPrice(e.target.value)
                setFieldErrors((er) => ({ ...er, buyNowPrice: undefined }))
              }}
              placeholder={`np. ${Math.ceil(Number(auction.current_price) * 1.5)}`}
            />
            {fieldErrors.buyNowPrice && <span className="field-error">{fieldErrors.buyNowPrice}</span>}
          </label>
        </div>

        <label className={fieldErrors.title ? 'has-error' : ''}>
          <span className="label-text">
            Tytuł<span className="req"> *</span>
          </span>
          <input
            maxLength={120}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setFieldErrors((er) => ({ ...er, title: undefined }))
            }}
          />
          {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
        </label>

        <label className={fieldErrors.description ? 'has-error' : ''}>
          <span className="label-text">
            Opis<span className="req"> *</span>
          </span>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setFieldErrors((er) => ({ ...er, description: undefined }))
            }}
          />
          {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
        </label>

        <CitySuggest
          value={city}
          error={fieldErrors.city}
          onChange={(c) => {
            setCity(c)
            setFieldErrors((er) => ({ ...er, city: undefined }))
          }}
        />

        <div className={`photo-field ${fieldErrors.photos ? 'has-error' : ''}`}>
          <span className="field-label">
            Zdjęcia<span className="req"> *</span>
            <span className="muted"> ({photos.length}/{MAX_PHOTOS})</span>
          </span>
          {photos.length > 0 && (
            <div className="photo-grid">
              {photos.map((p, idx) => {
                const src = p.kind === 'remote' ? p.url : p.previewUrl
                return (
                  <div key={p.id} className={`photo-thumb ${idx === 0 ? 'is-cover' : ''}`}>
                    <img src={src} alt={`Zdjęcie ${idx + 1}`} />
                    {idx === 0 && <span className="cover-badge">Główne</span>}
                    <div className="photo-thumb-actions">
                      <button type="button" className="btn btn-ghost btn-xs" disabled={idx === 0} onClick={() => movePhoto(p.id, -1)}>
                        ←
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        disabled={idx === photos.length - 1}
                        onClick={() => movePhoto(p.id, 1)}
                      >
                        →
                      </button>
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => removePhoto(p.id)}>
                        Usuń
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {photos.length < MAX_PHOTOS && (
            <label className="photo-drop compact">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  onPickFile(e.target.files?.[0] ?? null)
                  e.target.value = ''
                }}
              />
              <strong>Dodaj zdjęcie</strong>
              <span>max {MAX_PHOTOS}</span>
            </label>
          )}
          {fieldErrors.photos && <span className="field-error">{fieldErrors.photos}</span>}
        </div>

        <fieldset className={`shipping ${fieldErrors.shipping ? 'has-error' : ''}`}>
          <legend>
            <span className="label-text">
              Odbiór / wysyłka<span className="req"> *</span>
            </span>
          </legend>
          {[
            ['odbior', 'Odbiór osobisty'],
            ['inpost', 'InPost'],
            ['kurier', 'Kurier'],
          ].map(([sid, label]) => (
            <label key={sid} className="checkbox">
              <input type="checkbox" checked={shipping.includes(sid)} onChange={() => toggleShipping(sid)} />
              {label}
            </label>
          ))}
          {fieldErrors.shipping && <span className="field-error">{fieldErrors.shipping}</span>}
        </fieldset>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-lg" disabled={busy} type="submit">
          {busy ? 'Zapisywanie…' : 'Zapisz zmiany'}
        </button>
      </form>

      {cropSrc && (
        <ImageCropDialog
          open={cropOpen}
          imageSrc={cropSrc}
          aspect={4 / 3}
          title="Przytnij zdjęcie"
          hint="Kadr 4:3 jak na karcie aukcji."
          onCancel={onCropCancel}
          onConfirm={onCropConfirm}
        />
      )}
    </div>
  )
}
