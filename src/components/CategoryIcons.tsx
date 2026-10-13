import type { CSSProperties, ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" width="32" height="32" fill="none" aria-hidden="true">
      {children}
    </svg>
  )
}

const s = {
  stroke: 'currentColor',
  strokeWidth: 2.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/** Pastel tiles closer to OLX vibe — navy glyphs */
const NAVY = '#1B2437'
export const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  moda: { bg: '#FFE3EA', fg: NAVY },
  elektronika: { bg: '#DDE9FF', fg: NAVY },
  komputery: { bg: '#DCEEFF', fg: NAVY },
  telefony: { bg: '#D8F5E8', fg: NAVY },
  dom: { bg: '#F8EBD3', fg: NAVY },
  ogrod: { bg: '#DCF3D6', fg: NAVY },
  sport: { bg: '#D8EFFA', fg: NAVY },
  pojazdy: { bg: '#FFE4D1', fg: NAVY },
  dziecko: { bg: '#FFE0EC', fg: NAVY },
  uroda: { bg: '#EDE0FF', fg: NAVY },
  ksiazki: { bg: '#F3E7D0', fg: NAVY },
  gry: { bg: '#DDE7FF', fg: NAVY },
  muzyka: { bg: '#FFE6D4', fg: NAVY },
  foto: { bg: '#D7EEFB', fg: NAVY },
  zegarki: { bg: '#F2E8D0', fg: NAVY },
  kolekcje: { bg: '#D9F0D4', fg: NAVY },
  biznes: { bg: '#DCE6F5', fg: NAVY },
  bilety: { bg: '#E9DEFF', fg: NAVY },
  zwierzeta: { bg: '#FFE5D4', fg: NAVY },
  inne: { bg: '#E8ECF2', fg: NAVY },
}

/** OLX-like pictograms: thick outline, obvious silhouette */
const ICONS: Record<string, ReactNode> = {
  moda: (
    <Icon>
      {/* T-shirt */}
      <path
        d="M16 14 12 18l4 3v15h16V21l4-3-4-4-4 3h-4l-4-3Z"
        {...s}
      />
      <path d="M20 14c0 2.2 1.8 4 4 4s4-1.8 4-4" {...s} />
    </Icon>
  ),
  elektronika: (
    <Icon>
      {/* TV */}
      <rect x="6" y="10" width="36" height="22" rx="3" {...s} />
      <path d="M16 38h16M24 32v6" {...s} />
      <rect x="10" y="14" width="28" height="14" rx="1.5" {...s} />
    </Icon>
  ),
  komputery: (
    <Icon>
      {/* Monitor + base */}
      <rect x="8" y="8" width="32" height="22" rx="3" {...s} />
      <path d="M18 36h12M24 30v6M12 42h24" {...s} />
    </Icon>
  ),
  telefony: (
    <Icon>
      <rect x="14" y="5" width="20" height="38" rx="4" {...s} />
      <path d="M20 9h8" {...s} />
      <circle cx="24" cy="38" r="1.6" fill="currentColor" />
    </Icon>
  ),
  dom: (
    <Icon>
      <path d="M6 22 24 7l18 15" {...s} />
      <path d="M10 20.5V40h28V20.5" {...s} />
      <path d="M20 40V26h8v14" {...s} />
    </Icon>
  ),
  ogrod: (
    <Icon>
      {/* Seedling */}
      <path d="M24 42V22" {...s} />
      <path d="M24 28c-7.5-1-12-7-12-13 6 0 11 4 12 10" {...s} />
      <path d="M24 24c7.5-1 12-6 12-12-6 0-11 4-12 10" {...s} />
      <path d="M14 42h20" {...s} />
    </Icon>
  ),
  sport: (
    <Icon>
      {/* Ball */}
      <circle cx="24" cy="24" r="15" {...s} />
      <path d="M9.5 20c4.5 2 9.5 3 14.5 3s10-1 14.5-3" {...s} />
      <path d="M24 9c2.8 4 4.5 9 4.5 15S26.8 35 24 39" {...s} />
      <path d="M24 9c-2.8 4-4.5 9-4.5 15S21.2 35 24 39" {...s} />
    </Icon>
  ),
  pojazdy: (
    <Icon>
      {/* Car front/side */}
      <path d="M8 28h32v7a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-7Z" {...s} />
      <path d="M10 28 14.5 16.5A3 3 0 0 1 17.3 15h13.4a3 3 0 0 1 2.8 1.5L38 28" {...s} />
      <circle cx="15" cy="37" r="3" {...s} />
      <circle cx="33" cy="37" r="3" {...s} />
      <path d="M17 22h14" {...s} />
    </Icon>
  ),
  dziecko: (
    <Icon>
      {/* Baby face */}
      <circle cx="24" cy="20" r="11" {...s} />
      <circle cx="19.5" cy="18.5" r="1.5" fill="currentColor" />
      <circle cx="28.5" cy="18.5" r="1.5" fill="currentColor" />
      <path d="M20 24.5c1.2 1.8 6.8 1.8 8 0" {...s} />
      <path d="M10 40c2.5-6 7.5-9 14-9s11.5 3 14 9" {...s} />
    </Icon>
  ),
  uroda: (
    <Icon>
      {/* Sparkles */}
      <path d="M24 8v8M20 12h8" {...s} />
      <path d="M14 22v6M11 25h6" {...s} />
      <path d="M34 20v6M31 23h6" {...s} />
      <path d="M24 28c6 0 10 4 10 9H14c0-5 4-9 10-9Z" {...s} />
    </Icon>
  ),
  ksiazki: (
    <Icon>
      <path d="M8 12h14a5 5 0 0 1 5 5v21H13a5 5 0 0 1-5-5V12Z" {...s} />
      <path d="M27 12h13v26a5 5 0 0 1-5 5H27V17a5 5 0 0 1 0-5Z" {...s} />
      <path d="M12 18h8M12 24h6" {...s} />
    </Icon>
  ),
  gry: (
    <Icon>
      <rect x="5" y="16" width="38" height="18" rx="9" {...s} />
      <path d="M16 21v8M12 25h8" {...s} />
      <circle cx="30" cy="22.5" r="2" fill="currentColor" />
      <circle cx="35.5" cy="27.5" r="2" fill="currentColor" />
    </Icon>
  ),
  muzyka: (
    <Icon>
      <path d="M20 34a5.5 5.5 0 1 1-3-4.8V12l19-5v18" {...s} />
      <path d="M36 29.5a5.5 5.5 0 1 1-3-4.8" {...s} />
    </Icon>
  ),
  foto: (
    <Icon>
      <rect x="5" y="14" width="38" height="24" rx="4" {...s} />
      <circle cx="24" cy="26" r="8" {...s} />
      <path d="M15 14l2.5-5h13L33 14" {...s} />
      <circle cx="37" cy="20" r="1.8" fill="currentColor" />
    </Icon>
  ),
  zegarki: (
    <Icon>
      <circle cx="24" cy="24" r="11" {...s} />
      <path d="M24 16v9l6 3.5" {...s} />
      <path d="M18 5h12M18 43h12" {...s} />
      <path d="M20 8.5 18 5M28 8.5 30 5M20 39.5 18 43M28 39.5 30 43" {...s} />
    </Icon>
  ),
  kolekcje: (
    <Icon>
      {/* Trophy */}
      <path d="M16 14h16v6a8 8 0 0 1-16 0v-6Z" {...s} />
      <path d="M16 16H10a5 5 0 0 0 5 8M32 16h6a5 5 0 0 1-5 8" {...s} />
      <path d="M24 28v6M18 40h12M20 34h8" {...s} />
    </Icon>
  ),
  biznes: (
    <Icon>
      {/* Briefcase */}
      <rect x="6" y="16" width="36" height="24" rx="3" {...s} />
      <path d="M18 16V12a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" {...s} />
      <path d="M6 26h36" {...s} />
    </Icon>
  ),
  bilety: (
    <Icon>
      <path d="M7 15h34v5a4.5 4.5 0 0 0 0 9v5H7v-5a4.5 4.5 0 0 0 0-9v-5Z" {...s} />
      <path d="M18 15v19" strokeDasharray="3.5 3.5" {...s} />
    </Icon>
  ),
  zwierzeta: (
    <Icon>
      {/* Paw */}
      <circle cx="15" cy="16" r="4.5" {...s} />
      <circle cx="33" cy="16" r="4.5" {...s} />
      <circle cx="11" cy="26" r="3.8" {...s} />
      <circle cx="37" cy="26" r="3.8" {...s} />
      <ellipse cx="24" cy="32" rx="9" ry="8" {...s} />
    </Icon>
  ),
  inne: (
    <Icon>
      {/* 2x2 dots / grid */}
      <rect x="10" y="10" width="11" height="11" rx="2.5" {...s} />
      <rect x="27" y="10" width="11" height="11" rx="2.5" {...s} />
      <rect x="10" y="27" width="11" height="11" rx="2.5" {...s} />
      <rect x="27" y="27" width="11" height="11" rx="2.5" {...s} />
    </Icon>
  ),
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

export function resolveCategoryIconKey(id: string, name?: string): string {
  if (ICONS[id]) return id
  const base = id.split('-')[0]
  if (ICONS[base]) return base
  if (name) {
    for (const [re, key] of NAME_FALLBACKS) {
      if (re.test(name)) return key
    }
  }
  return 'inne'
}

export function categoryColor(id: string, name?: string) {
  const key = resolveCategoryIconKey(id, name)
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.inne
}

export function CategoryIcon({
  id,
  name,
  className,
  style,
}: {
  id: string
  name?: string
  className?: string
  style?: CSSProperties
}) {
  const key = resolveCategoryIconKey(id, name)
  return (
    <span className={className} style={style}>
      {ICONS[key] || ICONS.inne}
    </span>
  )
}
