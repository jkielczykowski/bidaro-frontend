import { supabase } from './supabase'

// bidigo-api (Java, bidigo-backend/api): same origin under /api/v1 — nginx in production,
// the Vite proxy (BIDIGO_API_URL) in development.

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function post<T>(path: string): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(`/api/v1${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`)
  return (await res.json()) as T
}

/** Opens (or reuses) a Stripe Checkout session paying one of the user's pending fee settlements. */
export function startSettlementCheckout(settlementId: string) {
  return post<{ checkoutUrl: string; expiresAt?: string }>(`/fee-settlements/${settlementId}/checkout`)
}
