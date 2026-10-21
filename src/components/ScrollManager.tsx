import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** Longest wait for a slow page (e.g. search results) to grow tall enough for the saved position. */
const RESTORE_TIMEOUT_MS = 10000
/** Once the position is reachable, keep holding it this long for late content (images, categories). */
const SETTLE_MS = 1500

/**
 * SPA scroll handling (BrowserRouter has none):
 * - new page (link / navigate) → top
 * - back / forward → the position the user left that entry at, once the page is tall enough
 * Search-param changes on the same page (filters, paging) keep their own scroll logic.
 */
export function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const currentKey = useRef(location.key)
  const lastPath = useRef(location.pathname)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    const onScroll = () => positions.current.set(currentKey.current, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Layout effect: switch keys before the new page's first scroll event, so the shorter
  // new page clamping scrollY can't overwrite the position saved for the page we left.
  useLayoutEffect(() => {
    currentKey.current = location.key
    const pathChanged = lastPath.current !== location.pathname
    lastPath.current = location.pathname

    if (navigationType !== 'POP') {
      if (pathChanged && !location.hash) window.scrollTo(0, 0)
      return
    }

    const target = positions.current.get(location.key) ?? 0
    const root = document.documentElement
    // Content above the fold (e.g. the category grid on the home page) loads after the restore;
    // with scroll anchoring the browser would push the view down by its height.
    root.style.overflowAnchor = 'none'
    let settleTimer = 0
    const apply = () => {
      const max = Math.max(root.scrollHeight - window.innerHeight, 0)
      window.scrollTo(0, Math.min(target, max))
      // Reachable now: hold a little longer for late content, then let go
      if (max >= target && !settleTimer) settleTimer = window.setTimeout(stop, SETTLE_MS)
    }
    const resize = new ResizeObserver(apply)
    resize.observe(document.body)

    function stop() {
      window.clearTimeout(settleTimer)
      resize.disconnect()
      root.style.overflowAnchor = ''
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', stop)
    }
    apply()
    // Keep the position while the page loads and settles; the user scrolling themselves wins
    const timer = window.setTimeout(stop, RESTORE_TIMEOUT_MS)
    window.addEventListener('wheel', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', stop)

    return () => {
      window.clearTimeout(timer)
      stop()
    }
  }, [location.key, location.pathname, location.hash, navigationType])

  return null
}
