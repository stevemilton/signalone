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
