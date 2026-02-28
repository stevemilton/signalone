/**
 * What3Words reverse geocoding — converts lat/lng to a 3-word address.
 * Server-only: reads WHAT3WORDS_API_KEY from process.env (no NEXT_PUBLIC_ prefix).
 */

export async function convertToWhat3Words(
  lat: number,
  lng: number
): Promise<string | null> {
  const apiKey = process.env.WHAT3WORDS_API_KEY
  if (!apiKey) {
    console.warn('WHAT3WORDS_API_KEY not set — skipping W3W lookup')
    return null
  }

  try {
    const res = await fetch(
      `https://api.what3words.com/v3/convert-to-3wa?coordinates=${lat},${lng}&key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    )

    if (!res.ok) {
      console.warn(`What3Words API returned ${res.status}`)
      return null
    }

    const data = await res.json()
    return data.words || null
  } catch (error) {
    console.warn('What3Words lookup failed:', error)
    return null
  }
}
