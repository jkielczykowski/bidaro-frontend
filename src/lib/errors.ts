/** Message of a thrown error — supabase-js errors (PostgrestError) are plain objects, not Error */
export function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'object' && err !== null && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message || fallback
  }
  return fallback
}
