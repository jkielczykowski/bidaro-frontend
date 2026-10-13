/**
 * City search via Photon (Komoot) — same approach as FluffyTag / mobile Bidigo.
 * Shows name + województwo; one row per city name in a voivodeship.
 */
export type CitySuggestion = {
  name: string
  displayName: string
  placeId: string
  lat: number
  lng: number
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    name?: string
    state?: string
    countrycode?: string
    osm_type?: string
    osm_id?: number | string
    osm_value?: string
    type?: string
  }
}

const PHOTON_URL = 'https://photon.komoot.io/api/'
/** Poland bbox — same as FluffyTag */
const PL_BBOX = '14.07,49.00,24.15,54.84'
const LOCALITY = new Set(['city', 'town', 'village', 'hamlet', 'municipality', 'suburb'])

function normalizePl(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const params = new URLSearchParams()
  params.set('q', q)
  params.set('limit', '36')
  params.set('bbox', PL_BBOX)
  for (const tag of ['place:city', 'place:town', 'place:village', 'place:hamlet', 'place:municipality']) {
    params.append('osm_tag', tag)
  }

  const res = await fetch(`${PHOTON_URL}?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return []

  const data = (await res.json()) as { features?: PhotonFeature[] }
  const out: CitySuggestion[] = []
  /** Dedupe by name+voivodeship (OSM often returns 2 nodes for the same village) */
  const seen = new Set<string>()

  for (const feature of data.features ?? []) {
    if (out.length >= 8) break
    const props = feature.properties
    if (!props) continue

    const cc = (props.countrycode || '').toLowerCase()
    if (cc && cc !== 'pl') continue

    const osmValue = (props.osm_value || '').toLowerCase()
    const type = (props.type || '').toLowerCase()
    if (!LOCALITY.has(osmValue) && !LOCALITY.has(type)) continue

    const name = props.name?.trim()
    if (!name) continue

    const coords = feature.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const [lng, lat] = coords
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    if (!props.osm_type || props.osm_id == null) continue

    const state = props.state?.trim() || ''
    const dedupeKey = `${normalizePl(name)}|${normalizePl(state)}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    out.push({
      name,
      displayName: state ? `${name}, ${state}` : name,
      placeId: `photon:${props.osm_type}:${props.osm_id}`,
      lat,
      lng,
    })
  }

  return out
}

export async function geocodeCity(query: string, signal?: AbortSignal): Promise<CitySuggestion | null> {
  const rows = await searchCities(query, signal)
  if (!rows.length) return null
  const nq = normalizePl(query)
  return rows.find((r) => normalizePl(r.name) === nq) ?? rows[0]
}
