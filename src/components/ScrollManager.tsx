import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/** How long to hold a restored position while the page is still loading its content. */
const RESTORE_TIMEOUT_MS = 3000

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
    const apply = () => window.scrollTo(0, Math.min(target, Math.max(root.scrollHeight - window.innerHeight, 0)))
    const resize = new ResizeObserver(apply)
    resize.observe(document.body)
    apply()

    const stop = () => {
      resize.disconnect()
      root.style.overflowAnchor = ''
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', stop)
    }
    // Keep the position while the page settles; the user scrolling themselves wins
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
