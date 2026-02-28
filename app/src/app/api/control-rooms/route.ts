import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import type { ControlRoom } from '@/types'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    let query: FirebaseFirestore.Query = adminDb.collection('controlRooms')

    if (activeOnly) {
      query = query.where('isActive', '==', true)
    }

    query = query.orderBy('name', 'asc')

    const snapshot = await query.get()
    const controlRooms = snapshot.docs.map((doc) => doc.data())

    return NextResponse.json({ controlRooms }, { status: 200 })
  } catch (error) {
    console.error('Get control rooms error:', error)
    return NextResponse.json({ error: 'Failed to fetch control rooms' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, coveragePostcodes, operatingHours, address, phone, email } = body

    // Validate required fields
    if (!name || !coveragePostcodes || !address || !phone || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, coveragePostcodes, address, phone, email' },
        { status: 400 }
      )
    }

    if (!Array.isArray(coveragePostcodes) || coveragePostcodes.length === 0) {
      return NextResponse.json(
        { error: 'coveragePostcodes must be a non-empty array' },
        { status: 400 }
      )
    }

    const now = Date.now()
    const controlRoomRef = adminDb.collection('controlRooms').doc()

    const controlRoomData: ControlRoom = {
      id: controlRoomRef.id,
      name: name.trim(),
      coveragePostcodes,
      operatingHours: operatingHours || '24/7',
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      isActive: true,
      operators: [],
      cameras: [],
      createdAt: now,
      updatedAt: now,
    }

    await controlRoomRef.set(controlRoomData)

    return NextResponse.json({ controlRoom: controlRoomData }, { status: 201 })
  } catch (error) {
    console.error('Create control room error:', error)
    return NextResponse.json({ error: 'Failed to create control room' }, { status: 500 })
  }
}
