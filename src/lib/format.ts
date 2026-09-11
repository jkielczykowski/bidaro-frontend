export function formatPln(value: number | string | null | undefined) {
  const n = typeof value === 'string' ? Number(value) : value ?? 0
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 2,
  }).format(n)
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

export function minNextBid(currentPrice: number, startingPrice: number, bidIncrement: number, bidCount: number) {
  if (bidCount === 0) return Number(startingPrice)
  return Number(currentPrice) + Number(bidIncrement)
}

/** Ricardo-style success fee: % of sale, min 0.50, max 290 */
export function calcSuccessFee(salePrice: number, feePercent: number) {
  const raw = salePrice * (feePercent / 100)
  return Math.min(290, Math.max(0.5, Math.round(raw * 100) / 100))
}
