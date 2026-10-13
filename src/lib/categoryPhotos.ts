import { resolveCategoryIconKey } from '../components/CategoryIcons'

const KEYS = [
  'moda',
  'elektronika',
  'komputery',
  'telefony',
  'dom',
  'ogrod',
  'sport',
  'pojazdy',
  'dziecko',
  'uroda',
  'ksiazki',
  'gry',
  'muzyka',
  'foto',
  'zegarki',
  'kolekcje',
  'biznes',
  'bilety',
  'zwierzeta',
  'inne',
] as const

type CatKey = (typeof KEYS)[number]

/** Small circular discs (~4KB webp / ~5KB jpg) */
const DISCS: Record<CatKey, { webp: string; jpg: string }> = Object.fromEntries(
  KEYS.map((k) => [k, { webp: `/categories/${k}.webp`, jpg: `/categories/${k}.jpg` }]),
) as Record<CatKey, { webp: string; jpg: string }>

export function categoryDiscSources(id: string, name?: string): { webp: string; jpg: string } {
  const key = resolveCategoryIconKey(id, name) as CatKey
  return DISCS[key] || DISCS.inne
}

/** @deprecated use categoryDiscSources */
export function categoryDiscSrc(id: string, name?: string): string {
  return categoryDiscSources(id, name).jpg
}
