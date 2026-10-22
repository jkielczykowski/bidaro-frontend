import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'

/** Badge refresh interval; each open tab of a signed-in user polls this often */
const POLL_MS = 30_000

type UnreadCtx = {
  unread: number
  refresh: () => Promise<number>
}

const Ctx = createContext<UnreadCtx>({ unread: 0, refresh: async () => 0 })

export function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) {
      setUnread(0)
      return 0
    }
    try {
      const { data, error } = await supabase.rpc('unread_messages_count')
      if (error) {
        console.error(error)
        return 0
      }
      const n = Number(data ?? 0)
      setUnread(n)
      return n
    } catch (err) {
      console.error(err)
      return 0
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setUnread(0)
      return
    }
    void refresh()
    // Poll only while the tab is visible, and catch up as soon as it is shown again
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user, refresh])

  const value = useMemo(() => ({ unread, refresh }), [unread, refresh])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUnreadMessages() {
  return useContext(Ctx)
}
