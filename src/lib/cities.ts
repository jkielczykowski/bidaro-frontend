/**
 * City search via Bidigo /api/search/cities (Photon proxy) — FluffyTag-style.
 * Fallback: direct Photon if proxy unavailable.
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

type RankedPlace = CitySuggestion & { kind: string; state: string; score: number }

const PHOTON_URL = 'https://photon.komoot.io/api/'
const PROXY_URL = '/api/search/cities'
/** Poland bbox — same as FluffyTag CitiesProperties */
const PL_BBOX = '14.07,49.00,24.15,54.84'
const LOCALITY = new Set(['city', 'town', 'village', 'hamlet', 'municipality', 'suburb'])
const KIND_RANK: Record<string, number> = {
  city: 0,
  town: 1,
  municipality: 2,
  suburb: 3,
  village: 4,
  hamlet: 5,
}
const MAX_RESULTS = 10

function normalizePl(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
}

function refineCityPlaces(raw: Omit<RankedPlace, 'score'>[], query: string): CitySuggestion[] {
  const nq = normalizePl(query)
  const scored: RankedPlace[] = raw.map((p) => {
    const nn = normalizePl(p.name)
    let score = (KIND_RANK[p.kind] ?? 9) * 100
    if (nn === nq) score -= 40
    else if (nn.startsWith(nq)) score -= 25
    else if (nq.startsWith(nn) && nn.length >= 3) score -= 10
    if (/[ąćęłńóśźż]/i.test(p.name)) score -= 8
    if (nn === 'warsaw' && nq.startsWith('warsz')) score += 50
    return { ...p, score }
  })
  scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'pl'))

  const hasUrbanMatch = scored.some(
    (p) =>
      (p.kind === 'city' || p.kind === 'town') &&
      (normalizePl(p.name) === nq ||
        normalizePl(p.name).startsWith(nq) ||
        nq.startsWith(normalizePl(p.name))),
  )

  const byKey = new Map<string, RankedPlace>()
  for (const p of scored) {
    const nn = normalizePl(p.name)
    if (hasUrbanMatch && (p.kind === 'village' || p.kind === 'hamlet' || p.kind === 'suburb')) {
      const urbanSame = scored.some(
        (u) => (u.kind === 'city' || u.kind === 'town') && normalizePl(u.name) === nn,
      )
      if (urbanSame) continue
    }
    const urban = p.kind === 'city' || p.kind === 'town'
    const key = urban ? `u:${nn}` : `v:${nn}|${normalizePl(p.state)}`
    if (!byKey.has(key)) byKey.set(key, p)
  }

  return [...byKey.values()].slice(0, MAX_RESULTS).map(({ name, displayName, placeId, lat, lng }) => ({
    name,
    displayName,
    placeId,
    lat,
    lng,
  }))
}

function parsePhotonFeatures(features: PhotonFeature[] | undefined, query: string): CitySuggestion[] {
  const raw: Omit<RankedPlace, 'score'>[] = []
  const seen = new Set<string>()

  for (const feature of features ?? []) {
    const props = feature.properties
    if (!props) continue

    const cc = (props.countrycode || '').toLowerCase()
    if (cc && cc !== 'pl') continue

    const osmValue = (props.osm_value || '').toLowerCase()
    const type = (props.type || '').toLowerCase()
    const kind = LOCALITY.has(osmValue) ? osmValue : type
    if (!LOCALITY.has(kind)) continue

    const name = props.name?.trim()
    if (!name) continue

    if (!props.osm_type || props.osm_id == null) continue
    const placeId = `photon:${props.osm_type}:${props.osm_id}`
    if (seen.has(placeId)) continue
    seen.add(placeId)

    const coords = feature.geometry?.coordinates
    if (!coords || coords.length < 2) continue
    const [lng, lat] = coords
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    const state = props.state?.trim() || ''
    raw.push({
      name,
      displayName: state ? `${name}, ${state}` : name,
      placeId,
      lat,
      lng,
      kind,
      state,
    })
  }

  return refineCityPlaces(raw, query)
}

async function searchCitiesPhoton(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const params = new URLSearchParams()
  params.set('q', query)
  params.set('limit', '40')
  params.set('lang', 'default')
  params.set('bbox', PL_BBOX)
  for (const tag of ['place:city', 'place:town', 'place:village', 'place:hamlet', 'place:municipality']) {
    params.append('osm_tag', tag)
  }

  const res = await fetch(`${PHOTON_URL}?${params}`, {
    signal,
    headers: { 'Accept-Language': 'pl' },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { features?: PhotonFeature[] }
  return parsePhotonFeatures(data.features, query)
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  try {
    const res = await fetch(`${PROXY_URL}?q=${encodeURIComponent(q)}`, { signal })
    if (res.ok) {
      const data = (await res.json()) as { places?: CitySuggestion[] }
      if (Array.isArray(data.places) && data.places.length > 0) return data.places.slice(0, MAX_RESULTS)
    }
  } catch {
    // fall through to Photon
  }

  try {
    return await searchCitiesPhoton(q, signal)
  } catch {
    return []
  }
}

export async function geocodeCity(query: string, signal?: AbortSignal): Promise<CitySuggestion | null> {
  const rows = await searchCities(query, signal)
  if (!rows.length) return null
  const nq = normalizePl(query)
  return rows.find((r) => normalizePl(r.name) === nq) ?? rows[0]
}
