import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
function encodeGeohash(lat: number, lng: number, precision = 9): string {
  let latMin = -90, latMax = 90
  let lngMin = -180, lngMax = 180
  let hash = '', bit = 0, ch = 0, isLng = true
  while (hash.length < precision) {
    if (isLng) {
      const mid = (lngMin + lngMax) / 2
      if (lng >= mid) { ch |= 1 << (4 - bit); lngMin = mid } else { lngMax = mid }
    } else {
      const mid = (latMin + latMax) / 2
      if (lat >= mid) { ch |= 1 << (4 - bit); latMin = mid } else { latMax = mid }
    }
    isLng = !isLng
    bit++
    if (bit === 5) { hash += BASE32[ch]; bit = 0; ch = 0 }
  }
  return hash
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const userData = userDoc.data()
    if (!userData || !['admin', 'control_room_manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id: controlRoomId } = await params

    // Verify control room exists
    const crDoc = await adminDb.collection('controlRooms').doc(controlRoomId).get()
    if (!crDoc.exists) {
      return NextResponse.json({ error: 'Control room not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, location, locationName, type, vmsReference, bearing, fieldOfView, tags } = body

    if (!name || !location?.lat || !location?.lng) {
      return NextResponse.json({ error: 'name, location.lat, and location.lng are required' }, { status: 400 })
    }

    const now = Date.now()
    const vmsRef = vmsReference || ''
    const docId = vmsRef
      ? `cam-${controlRoomId}-${vmsRef.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      : `cam-${controlRoomId}-${now}`

    const cameraDoc = {
      id: docId,
      name,
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
        accuracy: location.accuracy || 10,
        timestamp: now,
      },
      locationName: locationName || name,
      type: type || 'fixed',
      status: 'online',
      controlRoomId,
      vmsReference: vmsRef,
      vmsDeepLink: null,
      geohash: encodeGeohash(Number(location.lat), Number(location.lng)),
      bearing: bearing != null ? Number(bearing) : null,
      fieldOfView: fieldOfView != null ? Number(fieldOfView) : null,
      lastStatusCheck: null,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: now,
      updatedAt: now,
    }

    await adminDb.collection('cameras').doc(docId).set(cameraDoc)

    return NextResponse.json({ camera: cameraDoc }, { status: 201 })
  } catch (error) {
    console.error('Add camera error:', error)
    return NextResponse.json({ error: 'Failed to add camera' }, { status: 500 })
  }
}
