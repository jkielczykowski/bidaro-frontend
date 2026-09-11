import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CategoryPicker } from '../components/CategoryPicker'
import { CitySuggest } from '../components/CitySuggest'
import { ImageCropDialog } from '../components/ImageCropDialog'
import { useAuth } from '../lib/auth'
import type { Category } from '../lib/database.types'
import { calcSuccessFee, formatPln } from '../lib/format'
import { supabase } from '../lib/supabase'

const MAX_PHOTOS = 5

type PhotoItem = {
  id: string
  file: File
  previewUrl: string
}

type FieldErrors = {
  title?: string
  description?: string
  categoryId?: string
  city?: string
  photos?: string
  startingPrice?: string
  bidIncrement?: string
  reservePrice?: string
  buyNowPrice?: string
  shipping?: string
}

function isLeafCategory(categories: Category[], id: string) {
  return !!id && !categories.some((c) => c.parent_id === id)
}

export function CreateAuctionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [city, setCity] = useState('')
  const [startingPrice, setStartingPrice] = useState('50')
  const [reservePrice, setReservePrice] = useState('')
  const [bidIncrement, setBidIncrement] = useState('10')
  const [buyNowPrice, setBuyNowPrice] = useState('')
  const [durationDays, setDurationDays] = useState('3')
  const [shipping, setShipping] = useState<string[]>(['odbior'])
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        const cats = (data as Category[]) ?? []
        setCategories(cats)
      })
  }, [])

  useEffect(() => {
    if (!user) navigate('/logowanie')
  }, [user, navigate])

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc)
    }
  }, [cropSrc])

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, [])

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
    const url = URL.createObjectURL(picked)
    setCropSrc(url)
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
      return [...prev, { id: crypto.randomUUID(), file: cropped, previewUrl }]
    })
    setFieldErrors((e) => ({ ...e, photos: undefined }))
    setCropOpen(false)
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  function movePhoto(id: string, dir: -1 | 1) {
    setPhotos((prev) => {
      const i = prev.findIndex((p) => p.id === id)
      if (i < 0) return prev
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const feePercent = useMemo(() => {
    const cat = categories.find((c) => c.id === categoryId)
    return Number(cat?.fee_percent ?? 12)
  }, [categories, categoryId])

  const feePreviewPrice = useMemo(() => {
    const buy = buyNowPrice ? Number(buyNowPrice) : NaN
    const start = Number(startingPrice)
    const reserve = reservePrice ? Number(reservePrice) : NaN
    if (!Number.isNaN(buy) && buy > 0) return buy
    if (!Number.isNaN(reserve) && reserve > 0) return reserve
    return start > 0 ? start : 0
  }, [buyNowPrice, startingPrice, reservePrice])

  const feeAmount = useMemo(
    () => (feePreviewPrice > 0 ? calcSuccessFee(feePreviewPrice, feePercent) : 0),
    [feePreviewPrice, feePercent],
  )

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!title.trim() || title.trim().length < 5) {
      errs.title = 'Podaj tytuł (min. 5 znaków)'
    }
    if (!description.trim() || description.trim().length < 5) {
      errs.description = 'Opis jest wymagany (min. 5 znaków)'
    }
    if (!categoryId || !isLeafCategory(categories, categoryId)) {
      errs.categoryId = 'Wybierz szczegółową kategorię'
    }
    if (!city.trim() || city.trim().length < 2) {
      errs.city = 'Podaj miasto'
    }
    if (photos.length < 1) {
      errs.photos = 'Dodaj co najmniej 1 zdjęcie'
    } else if (photos.length > MAX_PHOTOS) {
      errs.photos = `Maksimum ${MAX_PHOTOS} zdjęć`
    }
    const start = Number(startingPrice)
    if (!startingPrice || Number.isNaN(start) || start < 1) {
      errs.startingPrice = 'Cena startowa min. 1 zł'
    }
    const inc = Number(bidIncrement)
    if (!bidIncrement || Number.isNaN(inc) || inc < 1) {
      errs.bidIncrement = 'Krok oferty min. 1 zł'
    }
    if (reservePrice) {
      const r = Number(reservePrice)
      if (Number.isNaN(r) || r < start) {
        errs.reservePrice = 'Minimum musi być ≥ ceny startowej'
      }
    }
    if (buyNowPrice) {
      const b = Number(buyNowPrice)
      if (Number.isNaN(b) || b <= start) {
        errs.buyNowPrice = 'Kup teraz musi być wyższe od ceny startowej'
      }
    }
    if (shipping.length < 1) {
      errs.shipping = 'Wybierz co najmniej jedną opcję dostawy'
    }
    return errs
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length) {
      setError('Uzupełnij wymagane pola')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const imageUrls: string[] = []
      for (const photo of photos) {
        const path = `${user.id}/${crypto.randomUUID()}.jpg`
        const { error: upErr } = await supabase.storage.from('auction-images').upload(path, photo.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        })
        if (upErr) throw upErr
        const { data: pub } = supabase.storage.from('auction-images').getPublicUrl(path)
        imageUrls.push(pub.publicUrl)
      }

      const endsAt = new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000).toISOString()
      const start = Number(startingPrice)

      const { data, error: insErr } = await supabase
        .from('auctions')
        .insert({
          seller_id: user.id,
          category_id: categoryId,
          title: title.trim(),
          description: description.trim(),
          image_urls: imageUrls,
          starting_price: start,
          current_price: start,
          reserve_price: reservePrice ? Number(reservePrice) : null,
          bid_increment: Number(bidIncrement),
          buy_now_price: buyNowPrice ? Number(buyNowPrice) : null,
          status: 'active',
          starts_at: new Date().toISOString(),
          ends_at: endsAt,
          city: city.trim(),
          shipping_options: shipping,
        })
        .select('*')
        .single()

      if (insErr) throw insErr
      navigate(`/aukcja/${(data as { id: string }).id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wystawić aukcji')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container narrow page">
      <h1>Wystaw aukcję</h1>
      <p className="muted">Wymagane: tytuł, opis, kategoria, miasto, min. 1 zdjęcie (max 5), ceny i dostawa.</p>
      <form className="card-form" onSubmit={onSubmit} noValidate>
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
            placeholder="Rower miejski — stan bdb"
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

        <CategoryPicker
          categories={categories}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id)
            setFieldErrors((er) => ({ ...er, categoryId: undefined }))
          }}
          error={fieldErrors.categoryId}
        />

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
            Zdjęcia oferty<span className="req"> *</span>
            <span className="muted"> ({photos.length}/{MAX_PHOTOS})</span>
          </span>
          {photos.length > 0 && (
            <div className="photo-grid">
              {photos.map((p, idx) => (
                <div key={p.id} className={`photo-thumb ${idx === 0 ? 'is-cover' : ''}`}>
                  <img src={p.previewUrl} alt={`Zdjęcie ${idx + 1}`} />
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
              ))}
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
              <strong>{photos.length === 0 ? 'Dodaj zdjęcie' : 'Dodaj kolejne'}</strong>
              <span>JPG lub PNG — przytniesz kadr · max {MAX_PHOTOS}</span>
            </label>
          )}
          {fieldErrors.photos && <span className="field-error">{fieldErrors.photos}</span>}
        </div>

        <div className="form-row">
          <label className={fieldErrors.startingPrice ? 'has-error' : ''}>
            <span className="label-text">
              Cena startowa (zł)<span className="req"> *</span>
            </span>
            <input
              type="number"
              min={1}
              value={startingPrice}
              onChange={(e) => {
                setStartingPrice(e.target.value)
                setFieldErrors((er) => ({ ...er, startingPrice: undefined }))
              }}
            />
            {fieldErrors.startingPrice && <span className="field-error">{fieldErrors.startingPrice}</span>}
          </label>
          <label className={fieldErrors.bidIncrement ? 'has-error' : ''}>
            <span className="label-text">
              Krok oferty (zł)<span className="req"> *</span>
            </span>
            <input
              type="number"
              min={1}
              value={bidIncrement}
              onChange={(e) => {
                setBidIncrement(e.target.value)
                setFieldErrors((er) => ({ ...er, bidIncrement: undefined }))
              }}
            />
            {fieldErrors.bidIncrement && <span className="field-error">{fieldErrors.bidIncrement}</span>}
          </label>
        </div>
        <div className="form-row">
          <label className={fieldErrors.reservePrice ? 'has-error' : ''}>
            <span className="label-text">Minimum (opcjonalnie)</span>
            <input type="number" min={0} value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} />
            {fieldErrors.reservePrice && <span className="field-error">{fieldErrors.reservePrice}</span>}
          </label>
          <label className={fieldErrors.buyNowPrice ? 'has-error' : ''}>
            <span className="label-text">Kup teraz (opcjonalnie)</span>
            <input type="number" min={0} value={buyNowPrice} onChange={(e) => setBuyNowPrice(e.target.value)} />
            {fieldErrors.buyNowPrice && <span className="field-error">{fieldErrors.buyNowPrice}</span>}
          </label>
        </div>
        <label>
          <span className="label-text">
            Czas trwania<span className="req"> *</span>
          </span>
          <select value={durationDays} onChange={(e) => setDurationDays(e.target.value)}>
            <option value="1">1 dzień</option>
            <option value="3">3 dni</option>
            <option value="7">7 dni</option>
            <option value="14">14 dni</option>
          </select>
        </label>
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
          ].map(([id, label]) => (
            <label key={id} className="checkbox">
              <input type="checkbox" checked={shipping.includes(id)} onChange={() => toggleShipping(id)} />
              {label}
            </label>
          ))}
          {fieldErrors.shipping && <span className="field-error">{fieldErrors.shipping}</span>}
        </fieldset>

        <div className="fee-box">
          <h3>Prowizja od sprzedaży</h3>
          <p>
            Wystawianie jest <strong>darmowe</strong>. Opłata nalicza się dopiero gdy ktoś kupi.
          </p>
          <ul>
            <li>
              Stawka dla kategorii: <strong>{feePercent}%</strong>
            </li>
            <li>
              Min. {formatPln(0.5)} · max {formatPln(290)}
            </li>
            {feePreviewPrice > 0 && (
              <li>
                Przy cenie {formatPln(feePreviewPrice)} zapłacisz ok. <strong>{formatPln(feeAmount)}</strong>
              </li>
            )}
          </ul>
        </div>

        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-lg" disabled={busy} type="submit">
          {busy ? 'Wystawianie…' : 'Wystaw aukcję'}
        </button>
      </form>

      {cropSrc && (
        <ImageCropDialog
          open={cropOpen}
          imageSrc={cropSrc}
          aspect={4 / 3}
          title="Przytnij zdjęcie oferty"
          hint="Przesuń i powiększ — kadr 4:3 jak na karcie aukcji."
          onCancel={onCropCancel}
          onConfirm={onCropConfirm}
        />
      )}
    </div>
  )
}
