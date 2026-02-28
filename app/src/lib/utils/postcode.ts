// UK Postcode validation and routing

const CONTROL_ROOM_COVERAGE: Record<string, { id: string; name: string; postcodes: string[] }> = {
  herts: {
    id: 'herts-cctv',
    name: 'Herts CCTV Partnership',
    postcodes: ['SG', 'AL', 'WD', 'EN', 'HP'],
  },
}

export function validatePostcode(postcode: string): boolean {
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase()
  const regex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/
  return regex.test(cleaned)
}

export function normalizePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toUpperCase()
}

export function getPostcodeArea(postcode: string): string {
  const cleaned = normalizePostcode(postcode)
  const match = cleaned.match(/^([A-Z]{1,2})/)
  return match ? match[1] : ''
}

export function findControlRoom(postcode: string): { id: string; name: string } | null {
  const area = getPostcodeArea(postcode)
  for (const room of Object.values(CONTROL_ROOM_COVERAGE)) {
    if (room.postcodes.includes(area)) {
      return { id: room.id, name: room.name }
    }
  }
  return null
}

export function formatPostcode(postcode: string): string {
  const cleaned = normalizePostcode(postcode)
  if (cleaned.length <= 4) return cleaned
  const outward = cleaned.slice(0, -3)
  const inward = cleaned.slice(-3)
  return `${outward} ${inward}`
}
