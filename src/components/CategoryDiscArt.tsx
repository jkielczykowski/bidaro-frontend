import type { ReactNode } from 'react'

/**
 * Soft product-style illustrations for OLX-like category discs.
 * Filled shapes (not outline icons) so they read as objects on pastel circles.
 */

type ArtProps = { className?: string }

function Art({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      width="78%"
      height="78%"
      aria-hidden
      focusable="false"
    >
      {children}
    </svg>
  )
}

const ART: Record<string, (p: ArtProps) => ReactNode> = {
  moda: ({ className }) => (
    <Art className={className}>
      <path
        fill="#E85A7A"
        d="M28 22 20 30l6 5v28h28V35l6-5-8-8-6 5H34l-6-5Z"
      />
      <path fill="#F7A8B8" d="M34 22c0 4 2.5 7 6 7s6-3 6-7" />
      <ellipse fill="#fff" opacity=".25" cx="40" cy="42" rx="8" ry="14" />
    </Art>
  ),
  elektronika: ({ className }) => (
    <Art className={className}>
      <rect x="18" y="14" width="44" height="42" rx="5" fill="#2B3A55" />
      <rect x="22" y="18" width="36" height="28" rx="2" fill="#6EC6FF" />
      <rect x="34" y="56" width="12" height="6" rx="1" fill="#2B3A55" />
      <rect x="28" y="62" width="24" height="4" rx="2" fill="#94A3B8" />
      <circle cx="52" cy="24" r="2" fill="#fff" opacity=".5" />
    </Art>
  ),
  komputery: ({ className }) => (
    <Art className={className}>
      <rect x="12" y="16" width="56" height="36" rx="4" fill="#334155" />
      <rect x="16" y="20" width="48" height="26" rx="2" fill="#93C5FD" />
      <rect x="32" y="52" width="16" height="5" rx="1" fill="#64748B" />
      <rect x="24" y="57" width="32" height="4" rx="2" fill="#94A3B8" />
      <path fill="#fff" opacity=".35" d="M20 24h20v4H20z" />
    </Art>
  ),
  telefony: ({ className }) => (
    <Art className={className}>
      <rect x="26" y="8" width="28" height="64" rx="6" fill="#1E293B" />
      <rect x="29" y="14" width="22" height="48" rx="2" fill="#7DD3FC" />
      <circle cx="40" cy="66" r="2.2" fill="#CBD5E1" />
      <rect x="35" y="11" width="10" height="2" rx="1" fill="#64748B" />
    </Art>
  ),
  dom: ({ className }) => (
    <Art className={className}>
      <path fill="#C4A484" d="M18 38h44v28H18z" />
      <path fill="#E8D5B7" d="M14 38 40 14l26 24H14z" />
      <rect x="34" y="48" width="12" height="18" rx="1" fill="#8B5E3C" />
      <rect x="22" y="44" width="10" height="10" rx="1" fill="#7DD3FC" />
      <rect x="48" y="44" width="10" height="10" rx="1" fill="#7DD3FC" />
    </Art>
  ),
  ogrod: ({ className }) => (
    <Art className={className}>
      <rect x="37" y="36" width="6" height="28" rx="2" fill="#8B5E3C" />
      <ellipse cx="28" cy="34" rx="14" ry="16" fill="#4ADE80" />
      <ellipse cx="48" cy="30" rx="12" ry="14" fill="#22C55E" />
      <ellipse cx="40" cy="40" rx="10" ry="12" fill="#86EFAC" />
      <ellipse cx="24" cy="66" rx="16" ry="4" fill="#A3E635" opacity=".5" />
    </Art>
  ),
  sport: ({ className }) => (
    <Art className={className}>
      <circle cx="40" cy="40" r="24" fill="#F8FAFC" />
      <circle cx="40" cy="40" r="24" fill="none" stroke="#1E293B" strokeWidth="2.5" />
      <path
        fill="none"
        stroke="#1E293B"
        strokeWidth="2"
        d="M40 16c4 8 6 16 6 24s-2 16-6 24M40 16c-4 8-6 16-6 24s2 16 6 24M18 32c8 3 16 4.5 22 4.5S56 35 64 32M18 48c8-3 16-4.5 22-4.5S56 45 64 48"
      />
      <circle cx="40" cy="40" r="6" fill="#1E293B" />
    </Art>
  ),
  pojazdy: ({ className }) => (
    <Art className={className}>
      <path
        fill="#F97316"
        d="M12 44h56v10a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V44z"
      />
      <path fill="#FB923C" d="M16 44 22 28a4 4 0 0 1 3.5-2.2h29A4 4 0 0 1 58 28l6 16H16z" />
      <rect x="24" y="32" width="14" height="8" rx="1.5" fill="#BAE6FD" />
      <rect x="42" y="32" width="14" height="8" rx="1.5" fill="#BAE6FD" />
      <circle cx="22" cy="56" r="6" fill="#1E293B" />
      <circle cx="22" cy="56" r="2.5" fill="#94A3B8" />
      <circle cx="58" cy="56" r="6" fill="#1E293B" />
      <circle cx="58" cy="56" r="2.5" fill="#94A3B8" />
    </Art>
  ),
  dziecko: ({ className }) => (
    <Art className={className}>
      <circle cx="40" cy="28" r="14" fill="#FBCFE8" />
      <circle cx="34" cy="26" r="2" fill="#1E293B" />
      <circle cx="46" cy="26" r="2" fill="#1E293B" />
      <path fill="none" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" d="M34 34c2 3 10 3 12 0" />
      <path fill="#F9A8D4" d="M18 58c3-10 10-16 22-16s19 6 22 16H18z" />
      <circle cx="28" cy="16" r="4" fill="#F472B6" />
      <circle cx="52" cy="16" r="4" fill="#F472B6" />
    </Art>
  ),
  uroda: ({ className }) => (
    <Art className={className}>
      <rect x="32" y="10" width="16" height="10" rx="2" fill="#C4B5FD" />
      <path fill="#A78BFA" d="M28 20h24l-4 40H32L28 20z" />
      <ellipse cx="40" cy="48" rx="8" ry="10" fill="#DDD6FE" opacity=".6" />
      <rect x="36" y="8" width="8" height="4" rx="1" fill="#8B5CF6" />
    </Art>
  ),
  ksiazki: ({ className }) => (
    <Art className={className}>
      <rect x="16" y="18" width="18" height="46" rx="2" fill="#F59E0B" transform="rotate(-6 25 41)" />
      <rect x="30" y="16" width="18" height="48" rx="2" fill="#3B82F6" />
      <rect x="44" y="20" width="18" height="44" rx="2" fill="#EF4444" transform="rotate(5 53 42)" />
      <path fill="#fff" opacity=".4" d="M33 24h12v2H33zM33 30h10v2H33z" />
    </Art>
  ),
  gry: ({ className }) => (
    <Art className={className}>
      <rect x="10" y="28" width="60" height="28" rx="14" fill="#6366F1" />
      <circle cx="28" cy="42" r="5" fill="#1E293B" />
      <path stroke="#1E293B" strokeWidth="3" strokeLinecap="round" d="M28 37v10M23 42h10" />
      <circle cx="50" cy="38" r="3.5" fill="#F43F5E" />
      <circle cx="58" cy="46" r="3.5" fill="#FBBF24" />
    </Art>
  ),
  muzyka: ({ className }) => (
    <Art className={className}>
      <circle cx="26" cy="54" r="10" fill="#1E293B" />
      <circle cx="26" cy="54" r="5" fill="#F97316" />
      <circle cx="54" cy="46" r="10" fill="#1E293B" />
      <circle cx="54" cy="46" r="5" fill="#F97316" />
      <path fill="#FB923C" d="M34 16v38h6V22l20-6v30h6V10L34 16z" />
    </Art>
  ),
  foto: ({ className }) => (
    <Art className={className}>
      <rect x="10" y="26" width="60" height="38" rx="6" fill="#334155" />
      <circle cx="40" cy="45" r="12" fill="#64748B" />
      <circle cx="40" cy="45" r="8" fill="#38BDF8" />
      <circle cx="40" cy="45" r="3" fill="#0F172A" />
      <path fill="#475569" d="M24 26l4-8h24l4 8H24z" />
      <circle cx="58" cy="34" r="3" fill="#FBBF24" />
    </Art>
  ),
  zegarki: ({ className }) => (
    <Art className={className}>
      <rect x="32" y="8" width="16" height="14" rx="2" fill="#94A3B8" />
      <rect x="32" y="58" width="16" height="14" rx="2" fill="#94A3B8" />
      <circle cx="40" cy="40" r="18" fill="#FDE68A" stroke="#B45309" strokeWidth="3" />
      <circle cx="40" cy="40" r="2" fill="#78350F" />
      <path stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" d="M40 28v12l8 5" />
    </Art>
  ),
  kolekcje: ({ className }) => (
    <Art className={className}>
      <ellipse cx="40" cy="48" rx="18" ry="6" fill="#CA8A04" />
      <path fill="#EAB308" d="M22 22h36v20a18 18 0 0 1-36 0V22z" />
      <path fill="#FDE047" d="M28 22h24v8H28z" />
      <rect x="36" y="48" width="8" height="10" fill="#A16207" />
      <rect x="28" y="58" width="24" height="6" rx="2" fill="#854D0E" />
    </Art>
  ),
  biznes: ({ className }) => (
    <Art className={className}>
      <rect x="12" y="28" width="56" height="36" rx="4" fill="#78716C" />
      <path fill="#A8A29E" d="M12 40h56v8H12z" />
      <rect x="30" y="16" width="20" height="14" rx="2" fill="#57534E" />
      <rect x="34" y="42" width="12" height="6" rx="1" fill="#D6D3D1" />
    </Art>
  ),
  bilety: ({ className }) => (
    <Art className={className}>
      <path
        fill="#A78BFA"
        d="M14 22h52v10a8 8 0 0 0 0 16v10H14V48a8 8 0 0 0 0-16V22z"
      />
      <path stroke="#fff" strokeWidth="2" strokeDasharray="4 4" d="M30 22v36" />
      <circle cx="48" cy="40" r="6" fill="#EDE9FE" />
    </Art>
  ),
  zwierzeta: ({ className }) => (
    <Art className={className}>
      <ellipse cx="40" cy="48" rx="18" ry="16" fill="#D6A77A" />
      <circle cx="40" cy="30" r="14" fill="#E8C39E" />
      <ellipse cx="28" cy="18" rx="7" ry="10" fill="#D6A77A" />
      <ellipse cx="52" cy="18" rx="7" ry="10" fill="#D6A77A" />
      <circle cx="34" cy="28" r="2.5" fill="#1E293B" />
      <circle cx="46" cy="28" r="2.5" fill="#1E293B" />
      <ellipse cx="40" cy="36" rx="4" ry="3" fill="#FDBA74" />
    </Art>
  ),
  inne: ({ className }) => (
    <Art className={className}>
      <rect x="16" y="16" width="20" height="20" rx="5" fill="#94A3B8" />
      <rect x="44" y="16" width="20" height="20" rx="5" fill="#64748B" />
      <rect x="16" y="44" width="20" height="20" rx="5" fill="#64748B" />
      <rect x="44" y="44" width="20" height="20" rx="5" fill="#475569" />
    </Art>
  ),
}

export function CategoryDiscArt({
  id,
  name,
  className,
}: {
  id: string
  name?: string
  className?: string
}) {
  // resolve via same keys as CategoryIcons — imported lazily-safe duplicate
  const key = resolveKey(id, name)
  const render = ART[key] || ART.inne
  return <>{render({ className })}</>
}

const NAME_FALLBACKS: [RegExp, string][] = [
  [/odzież|moda|ubrani|akcesor/i, 'moda'],
  [/elektronik|agd|tv/i, 'elektronika'],
  [/komputer|laptop|sieć/i, 'komputery'],
  [/telefon|tablet/i, 'telefony'],
  [/dom|mieszkani|mebl/i, 'dom'],
  [/ogród|majster|narzęd/i, 'ogrod'],
  [/sport|rower|fitness|wypocz/i, 'sport'],
  [/pojazd|auto|moto/i, 'pojazdy'],
  [/dzieck|niemowl|zabawk/i, 'dziecko'],
  [/uroda|zdrowie|kosmet/i, 'uroda'],
  [/książ|komiks/i, 'ksiazki'],
  [/gry|konsol/i, 'gry'],
  [/muzyk|instrument/i, 'muzyka'],
  [/foto|optyk|aparat/i, 'foto'],
  [/zegark|biżut/i, 'zegarki'],
  [/kolekc|antyk/i, 'kolekcje'],
  [/biznes|przemysł/i, 'biznes'],
  [/bilet|kupon/i, 'bilety'],
  [/zwierzę|zwierze/i, 'zwierzeta'],
]

function resolveKey(id: string, name?: string): string {
  if (ART[id]) return id
  const base = id.split('-')[0]
  if (ART[base]) return base
  if (name) {
    for (const [re, key] of NAME_FALLBACKS) {
      if (re.test(name)) return key
    }
  }
  return 'inne'
}
