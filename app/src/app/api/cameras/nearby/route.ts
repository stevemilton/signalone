import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'

const EARTH_RADIUS_M = 6_371_000

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') ?? '')
    const lng = parseFloat(searchParams.get('lng') ?? '')
    const controlRoomId = searchParams.get('controlRoomId')
    const radius = parseFloat(searchParams.get('radius') ?? '200')
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)

    if (isNaN(lat) || isNaN(lng) || !controlRoomId) {
      return NextResponse.json(
        { error: 'lat, lng, and controlRoomId are required' },
        { status: 400 }
      )
    }

    // Fetch all online cameras for this control room
    const snapshot = await adminDb
      .collection('cameras')
      .where('controlRoomId', '==', controlRoomId)
      .where('status', '==', 'online')
      .get()

    // Compute deep-link template if available
    const crDoc = await adminDb.collection('controlRooms').doc(controlRoomId).get()
    const crData = crDoc.data()
    const deepLinkTemplate: string | null = crData?.vmsConfig?.deepLinkTemplate ?? null

    // Compute distance, filter within radius, sort ascending
    const camerasWithDistance = snapshot.docs
      .map((doc) => {
        const data = doc.data()
        const camLat = data.location?.lat
        const camLng = data.location?.lng
        if (typeof camLat !== 'number' || typeof camLng !== 'number') return null
        const distanceMetres = Math.round(haversineDistance(lat, lng, camLat, camLng))
        const vmsRef: string = data.vmsReference ?? ''
        const vmsDeepLink = deepLinkTemplate
          ? deepLinkTemplate.replace('{vmsReference}', vmsRef)
          : (data.vmsDeepLink ?? null)
        return { ...data, distanceMetres, vmsDeepLink }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null && c.distanceMetres <= radius)
      .sort((a, b) => a.distanceMetres - b.distanceMetres)

    const totalInRadius = camerasWithDistance.length
    const cameras = camerasWithDistance.slice(0, limit)

    return NextResponse.json(
      { cameras, totalInRadius, searchRadius: radius },
      { status: 200 }
    )
  } catch (error) {
    console.error('Nearby cameras error:', error)
    return NextResponse.json({ error: 'Failed to fetch nearby cameras' }, { status: 500 })
  }
}
