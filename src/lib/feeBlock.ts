import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'

/** public.my_fee_block(): a seller with a fee unpaid 14 days after the sale can't bid or list */
export type FeeBlock = {
  blocked: boolean
  overdue_amount: number
  overdue_count: number
  due_soon_amount: number
  next_due_at: string | null
  pending_amount: number
  payment_days: number
}

/** Errors raised by the database block carry this hint */
export function isFeeBlockError(err: unknown) {
  return typeof err === 'object' && err !== null && (err as { hint?: string }).hint === 'fees_overdue'
}

export function useFeeBlock() {
  const { user } = useAuth()
  const [block, setBlock] = useState<FeeBlock | null>(null)

  const reload = useCallback(async () => {
    if (!user) {
      setBlock(null)
      return
    }
    const { data, error } = await supabase.rpc('my_fee_block')
    setBlock(error ? null : (data as FeeBlock))
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  return { block, reload }
}
