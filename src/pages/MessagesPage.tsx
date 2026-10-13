import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import type { Conversation, Message } from '../lib/database.types'
import { formatPln } from '../lib/format'
import { newId } from '../lib/id'
import { supabase } from '../lib/supabase'
import { useUnreadMessages } from '../lib/unreadMessages'

type ConversationRow = Conversation & {
  auction?: { id: string; title: string; current_price: number; image_urls: string[] | null } | null
  buyer?: { id: string; display_name: string | null } | null
  seller?: { id: string; display_name: string | null } | null
  lastMessage?: Message | null
  unreadCount?: number
}

function myLastReadAt(c: Conversation, userId: string) {
  return userId === c.buyer_id ? c.buyer_last_read_at : c.seller_last_read_at
}

function otherLastReadAt(c: Conversation, userId: string) {
  return userId === c.buyer_id ? c.seller_last_read_at : c.buyer_last_read_at
}

export function MessagesPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { refresh: refreshUnread } = useUnreadMessages()
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [active, setActive] = useState<ConversationRow | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** First unread message id captured when opening the thread (before mark-as-read). */
  const [unreadAnchorId, setUnreadAnchorId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const openedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  async function loadConversations() {
    if (!user) return [] as ConversationRow[]
    const { data, error: err } = await supabase
      .from('conversations')
      .select(
        '*, auction:auctions(id, title, current_price, image_urls), buyer:profiles!conversations_buyer_id_fkey(id, display_name), seller:profiles!conversations_seller_id_fkey(id, display_name)',
      )
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      return []
    }
    const rows = (data as ConversationRow[]) ?? []
    const ids = rows.map((r) => r.id)
    if (!ids.length) {
      setConversations([])
      return []
    }

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })

    const all = (msgs as Message[]) ?? []
    const enriched = rows.map((c) => {
      const mine = all.filter((m) => m.conversation_id === c.id)
      const lastMessage = mine[0] ?? null
      const readAt = myLastReadAt(c, user.id)
      const unreadCount = mine.filter(
        (m) => m.sender_id !== user.id && (!readAt || new Date(m.created_at) > new Date(readAt)),
      ).length
      return { ...c, lastMessage, unreadCount }
    })

    enriched.sort((a, b) => {
      const at = a.lastMessage?.created_at || a.created_at
      const bt = b.lastMessage?.created_at || b.created_at
      return new Date(bt).getTime() - new Date(at).getTime()
    })

    setConversations(enriched)
    return enriched
  }

  async function loadMessages(conversationId: string) {
    const { data, error: err } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (err) {
      setError(err.message)
      return [] as Message[]
    }
    const rows = (data as Message[]) ?? []
    setMessages(rows)
    return rows
  }

  async function markRead(conversationId: string) {
    const { data, error: err } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: conversationId,
    })
    if (err) {
      console.error(err)
      return
    }
    const updated = data as Conversation
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, ...updated, unreadCount: 0 } : c)),
    )
    setActive((prev) => (prev?.id === conversationId ? { ...prev, ...updated, unreadCount: 0 } : prev))
    void refreshUnread()
  }

  useEffect(() => {
    if (!user) return
    void (async () => {
      setLoading(true)
      await loadConversations()
      setLoading(false)
    })()
  }, [user])

  useEffect(() => {
    if (!user || !id) {
      if (!id) {
        setActive(null)
        setUnreadAnchorId(null)
        openedRef.current = null
      }
      return
    }

    void (async () => {
      let list = conversations
      if (!list.length) {
        list = await loadConversations()
      }
      const found = list.find((c) => c.id === id) || null
      setActive(found)
      if (!found) return

      const rows = await loadMessages(found.id)

      if (openedRef.current !== found.id) {
        openedRef.current = found.id
        const readAt = myLastReadAt(found, user.id)
        const firstUnread = rows.find(
          (m) => m.sender_id !== user.id && (!readAt || new Date(m.created_at) > new Date(readAt)),
        )
        setUnreadAnchorId(firstUnread?.id ?? null)
        await markRead(found.id)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once per conversation id
  }, [id, user])

  useEffect(() => {
    if (!active?.id || !user) return
    const channel = supabase
      .channel(`messages-${active.id}-${newId()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active.id}` },
        (payload) => {
          const row = payload.new as Message
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
          setConversations((prev) =>
            prev
              .map((c) => (c.id === active.id ? { ...c, lastMessage: row } : c))
              .sort((a, b) => {
                const at = a.lastMessage?.created_at || a.created_at
                const bt = b.lastMessage?.created_at || b.created_at
                return new Date(bt).getTime() - new Date(at).getTime()
              }),
          )
          if (row.sender_id !== user.id) {
            void markRead(active.id)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `id=eq.${active.id}` },
        (payload) => {
          const row = payload.new as Conversation
          setActive((prev) => (prev ? { ...prev, ...row } : prev))
          setConversations((prev) => prev.map((c) => (c.id === row.id ? { ...c, ...row } : c)))
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [active?.id, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e: FormEvent) {
    e.preventDefault()
    if (!user || !active) return
    const text = body.trim()
    if (!text) return
    setSending(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .insert({
          conversation_id: active.id,
          sender_id: user.id,
          body: text,
        })
        .select('*')
        .single()
      if (err) throw err
      const row = data as Message
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]))
      setConversations((prev) =>
        prev
          .map((c) => (c.id === active.id ? { ...c, lastMessage: row } : c))
          .sort((a, b) => {
            const at = a.lastMessage?.created_at || a.created_at
            const bt = b.lastMessage?.created_at || b.created_at
            return new Date(bt).getTime() - new Date(at).getTime()
          }),
      )
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się wysłać')
    } finally {
      setSending(false)
    }
  }

  function otherName(c: ConversationRow) {
    if (!user) return 'Użytkownik'
    if (user.id === c.buyer_id) return c.seller?.display_name || 'Sprzedawca'
    return c.buyer?.display_name || 'Kupujący'
  }

  if (!user) return null

  const mobileThread = Boolean(id)

  return (
    <div className={`container page messages-page${mobileThread ? ' has-thread' : ''}`}>
      <div className="messages-hero desktop-only">
        <h1>Wiadomości</h1>
        <p className="muted">Chat pojawia się dopiero po sprzedaży — dogadajcie odbiór i płatność.</p>
      </div>

      <div className="chat-layout">
        <aside className={`chat-list${mobileThread ? ' is-hidden-mobile' : ''}`}>
          <div className="chat-list-head mobile-only">
            <h1>Wiadomości</h1>
            <p className="muted">Po sprzedaży dogadajcie odbiór i płatność.</p>
          </div>
          {loading && <p className="muted chat-list-empty">Ładowanie…</p>}
          {!loading && conversations.length === 0 && (
            <p className="muted chat-list-empty">Brak rozmów. Pojawią się po sprzedanej aukcji.</p>
          )}
          {conversations.map((c) => {
            const img = c.auction?.image_urls?.[0]
            const unread = (c.unreadCount ?? 0) > 0
            return (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={['chat-list-item', active?.id === c.id ? 'active' : '', unread ? 'unread' : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="chat-list-thumb">{img ? <img src={img} alt="" /> : <span>JL</span>}</div>
                <div className="chat-list-body">
                  <div className="chat-list-top">
                    <strong>{c.auction?.title || 'Aukcja'}</strong>
                    {unread && <span className="unread-badge">{c.unreadCount}</span>}
                  </div>
                  <span className={unread ? 'chat-preview unread-text' : 'chat-preview muted'}>
                    {c.lastMessage
                      ? `${c.lastMessage.sender_id === user.id ? 'Ty: ' : ''}${c.lastMessage.body}`
                      : `${otherName(c)}${c.auction?.current_price != null ? ` · ${formatPln(c.auction.current_price)}` : ''}`}
                  </span>
                </div>
              </Link>
            )
          })}
        </aside>

        <section className={`chat-panel${mobileThread ? ' is-open-mobile' : ' is-idle-mobile'}`}>
          {!active ? (
            <div className="chat-empty desktop-only">
              <p className="muted">Wybierz rozmowę z listy.</p>
            </div>
          ) : (
            <>
              <header className="chat-panel-head">
                <Link to="/messages" className="chat-back mobile-only" aria-label="Wróć do listy">
                  ←
                </Link>
                <div className="chat-panel-head-text">
                  <h2>{active.auction?.title || 'Rozmowa'}</h2>
                  <p className="muted">
                    z {otherName(active)}
                    {active.auction?.id && (
                      <>
                        {' · '}
                        <Link to={`/auction/${active.auction.id}`}>aukcja</Link>
                      </>
                    )}
                  </p>
                </div>
              </header>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <p className="muted chat-first">Napisz pierwszą wiadomość — np. jak i kiedy odbieracie.</p>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === user.id
                  const otherRead = otherLastReadAt(active, user.id)
                  const wasReadByOther =
                    mine && !!otherRead && new Date(otherRead) >= new Date(m.created_at)
                  const isLastMine =
                    mine && !messages.slice(messages.indexOf(m) + 1).some((x) => x.sender_id === user.id)
                  return (
                    <div key={m.id} className={mine ? 'chat-row mine' : 'chat-row'}>
                      {unreadAnchorId === m.id && (
                        <div className="unread-divider" role="separator">
                          <span>Nowe · nieprzeczytane</span>
                        </div>
                      )}
                      <div className={mine ? 'chat-bubble mine' : 'chat-bubble'}>
                        {!mine && <span className="chat-sender">{otherName(active)}</span>}
                        <p>{m.body}</p>
                        <div className="chat-meta">
                          <time>
                            {new Date(m.created_at).toLocaleString('pl-PL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                          {mine && (
                            <span className={wasReadByOther ? 'read-status read' : 'read-status'}>
                              {wasReadByOther ? '✓ Przeczytane' : 'Wysłane'}
                            </span>
                          )}
                        </div>
                      </div>
                      {isLastMine && !wasReadByOther && (
                        <span className="read-hint">Czeka na przeczytanie</span>
                      )}
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <form className="chat-compose" onSubmit={(e) => void send(e)}>
                {error && <p className="error">{error}</p>}
                <div className="chat-compose-bar">
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={4000}
                    placeholder="Napisz wiadomość…"
                    disabled={sending}
                  />
                  <button className="btn btn-primary" type="submit" disabled={sending || !body.trim()}>
                    Wyślij
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
