const EARTH_RADIUS_M = 6_371_000

/**
 * Haversine distance between two GPS points in metres.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Base32 alphabet used by standard geohash encoding
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

/**
 * Encode a lat/lng pair into a geohash string.
 * @param precision Number of characters (default 9, ~5m accuracy)
 */
export function encodeGeohash(
  lat: number,
  lng: number,
  precision = 9
): string {
  let latMin = -90,
    latMax = 90
  let lngMin = -180,
    lngMax = 180
  let hash = ''
  let bit = 0
  let ch = 0
  let isLng = true

  while (hash.length < precision) {
    if (isLng) {
      const mid = (lngMin + lngMax) / 2
      if (lng >= mid) {
        ch |= 1 << (4 - bit)
        lngMin = mid
      } else {
        lngMax = mid
      }
    } else {
      const mid = (latMin + latMax) / 2
      if (lat >= mid) {
        ch |= 1 << (4 - bit)
        latMin = mid
      } else {
        latMax = mid
      }
    }
    isLng = !isLng
    bit++
    if (bit === 5) {
      hash += BASE32[ch]
      bit = 0
      ch = 0
    }
  }

  return hash
}

/**
 * Decode a geohash string into a lat/lng center point.
 */
export function decodeGeohash(hash: string): { lat: number; lng: number } {
  let latMin = -90,
    latMax = 90
  let lngMin = -180,
    lngMax = 180
  let isLng = true

  for (const c of hash) {
    const idx = BASE32.indexOf(c)
    if (idx === -1) break
    for (let bit = 4; bit >= 0; bit--) {
      if (isLng) {
        const mid = (lngMin + lngMax) / 2
        if ((idx >> bit) & 1) {
          lngMin = mid
        } else {
          lngMax = mid
        }
      } else {
        const mid = (latMin + latMax) / 2
        if ((idx >> bit) & 1) {
          latMin = mid
        } else {
          latMax = mid
        }
      }
      isLng = !isLng
    }
  }

  return {
    lat: (latMin + latMax) / 2,
    lng: (lngMin + lngMax) / 2,
  }
}

/**
 * Get the bounding box of a geohash cell.
 */
export function geohashToBoundingBox(hash: string): {
  latMin: number
  latMax: number
  lngMin: number
  lngMax: number
} {
  let latMin = -90,
    latMax = 90
  let lngMin = -180,
    lngMax = 180
  let isLng = true

  for (const c of hash) {
    const idx = BASE32.indexOf(c)
    if (idx === -1) break
    for (let bit = 4; bit >= 0; bit--) {
      if (isLng) {
        const mid = (lngMin + lngMax) / 2
        if ((idx >> bit) & 1) {
          lngMin = mid
        } else {
          lngMax = mid
        }
      } else {
        const mid = (latMin + latMax) / 2
        if ((idx >> bit) & 1) {
          latMin = mid
        } else {
          latMax = mid
        }
      }
      isLng = !isLng
    }
  }

  return { latMin, latMax, lngMin, lngMax }
}

/**
 * Get the 8 neighbouring geohash cells (same precision).
 */
export function geohashNeighbors(hash: string): string[] {
  const { lat, lng } = decodeGeohash(hash)
  const bbox = geohashToBoundingBox(hash)
  const latStep = bbox.latMax - bbox.latMin
  const lngStep = bbox.lngMax - bbox.lngMin
  const precision = hash.length

  const offsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ]

  const neighbors: string[] = []
  for (const [dLat, dLng] of offsets) {
    const nLat = lat + dLat * latStep
    const nLng = lng + dLng * lngStep
    if (nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180) {
      neighbors.push(encodeGeohash(nLat, nLng, precision))
    }
  }

  return [...new Set(neighbors)]
}
