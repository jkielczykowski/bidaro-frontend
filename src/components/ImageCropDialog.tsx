import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Modal } from './Modal'

type ImageCropDialogProps = {
  open: boolean
  imageSrc: string
  /** width / height — FluffyTag pets use 1:1; auctions look better as 4/3 */
  aspect?: number
  title?: string
  hint?: string
  onCancel: () => void
  onConfirm: (file: File) => void
}

async function getCroppedFile(imageSrc: string, crop: Area, fileName: string): Promise<File> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas niedostępny')

  const maxW = 1600
  const scale = Math.min(1, maxW / crop.width)
  canvas.width = Math.round(crop.width * scale)
  canvas.height = Math.round(crop.height * scale)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Nie udało się zapisać kadru'))), 'image/jpeg', 0.92)
  })

  return new File([blob], fileName.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error('Nie udało się wczytać zdjęcia')))
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

export function ImageCropDialog({
  open,
  imageSrc,
  aspect = 4 / 3,
  title = 'Przytnij zdjęcie',
  hint = 'Przesuń i powiększ, żeby ładnie skadrować ofertę.',
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedArea(null)
      setError(null)
      setSaving(false)
    }
  }, [open, imageSrc])

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedArea(pixels)
  }, [])

  async function confirm() {
    if (!croppedArea || saving) return
    setSaving(true)
    setError(null)
    try {
      const file = await getCroppedFile(imageSrc, croppedArea, 'auction.jpg')
      onConfirm(file)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd kadrowania')
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={title} onClose={() => !saving && onCancel()}>
      <p className="muted crop-hint">{hint}</p>
      <div className="cropper-shell">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          objectFit="contain"
          showGrid
        />
      </div>
      <div className="crop-zoom">
        <button type="button" className="btn btn-outline crop-zoom-btn" onClick={() => setZoom((z) => Math.max(1, z - 0.15))} aria-label="Pomniejsz">
          −
        </button>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
        />
        <button type="button" className="btn btn-outline crop-zoom-btn" onClick={() => setZoom((z) => Math.min(3, z + 0.15))} aria-label="Powiększ">
          +
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" disabled={saving} onClick={onCancel}>
          Anuluj
        </button>
        <button type="button" className="btn btn-primary" disabled={saving || !croppedArea} onClick={() => void confirm()}>
          {saving ? 'Przycinanie…' : 'Przytnij'}
        </button>
      </div>
    </Modal>
  )
}
