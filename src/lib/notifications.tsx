import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'

type NotificationsCtx = {
  unread: number
  refresh: () => Promise<number>
}

const Ctx = createContext<NotificationsCtx>({ unread: 0, refresh: async () => 0 })

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    if (!user) {
      setUnread(0)
      return 0
    }
    try {
      const { data, error } = await supabase.rpc('unread_notifications_count')
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
    const t = window.setInterval(() => {
      void refresh()
    }, 12000)
    return () => window.clearInterval(t)
  }, [user, refresh])

  const value = useMemo(() => ({ unread, refresh }), [unread, refresh])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useNotifications() {
  return useContext(Ctx)
}
