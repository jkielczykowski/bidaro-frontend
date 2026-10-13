export function formatPln(value: number | string | null | undefined) {
  const n = typeof value === 'string' ? Number(value) : value ?? 0
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  }).format(n)
}

/** Polish plural for auction bids / "podbicia". */
export function bidLabel(count: number | null | undefined) {
  const n = Number(count ?? 0)
  if (n <= 0) return 'Brak podbić'
  if (n === 1) return '1 podbicie'
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} podbicia`
  return `${n} podbić`
}

export function formatRemaining(endsAt: string, now = Date.now()) {
  const ms = new Date(endsAt).getTime() - now
  if (ms <= 0) return 'Zakończona'
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':')
}

/** HH:MM:SS countdown for Bidigo home cards */
export function formatCountdown(endsAt: string, now = Date.now()) {
  const ms = new Date(endsAt).getTime() - now
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((x) => String(x).padStart(2, '0')).join(':')
}

export function ofertLabel(count: number | null | undefined) {
  const n = Number(count ?? 0)
  if (n === 1) return '1 oferta'
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} oferty`
  return `${n} ofert`
}

export function minNextBid(currentPrice: number, startingPrice: number, bidIncrement: number, bidCount: number) {
  if (bidCount === 0) return Number(startingPrice)
  return Number(currentPrice) + Number(bidIncrement)
}

/** Success fee: % of sale, min 2 zł, max 150 (P24-oriented) */
export function calcSuccessFee(salePrice: number, feePercent: number) {
  const raw = salePrice * (feePercent / 100)
  return Math.min(150, Math.max(2, Math.round(raw * 100) / 100))
}
