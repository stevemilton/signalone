import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const controlRoomDoc = await adminDb.collection('controlRooms').doc(id).get()

    if (!controlRoomDoc.exists) {
      return NextResponse.json({ error: 'Control room not found' }, { status: 404 })
    }

    const controlRoom = controlRoomDoc.data()

    // Fetch cameras for this control room
    const camerasSnapshot = await adminDb
      .collection('cameras')
      .where('controlRoomId', '==', id)
      .get()

    const cameras = camerasSnapshot.docs.map((doc) => doc.data())

    // Fetch operators for this control room
    const operatorsSnapshot = await adminDb
      .collection('operators')
      .where('controlRoomId', '==', id)
      .get()

    const operators = operatorsSnapshot.docs.map((doc) => doc.data())

    return NextResponse.json(
      {
        controlRoom: {
          ...controlRoom,
          cameras,
        },
        operators,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get control room error:', error)
    return NextResponse.json({ error: 'Failed to fetch control room' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin or control_room_manager role
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (!userData || !['admin', 'control_room_manager'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Admin or control room manager access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const controlRoomDoc = await adminDb.collection('controlRooms').doc(id).get()

    if (!controlRoomDoc.exists) {
      return NextResponse.json({ error: 'Control room not found' }, { status: 404 })
    }

    // If control_room_manager, verify they manage this room
    if (userData.role === 'control_room_manager' && userData.controlRoomId !== id) {
      return NextResponse.json(
        { error: 'You can only manage your own control room' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const now = Date.now()

    const updatableFields = [
      'name',
      'coveragePostcodes',
      'operatingHours',
      'address',
      'phone',
      'email',
      'isActive',
      'operators',
    ]

    const updates: Record<string, unknown> = { updatedAt: now }

    for (const [key, value] of Object.entries(body)) {
      if (updatableFields.includes(key)) {
        updates[key] = value
      }
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await adminDb.collection('controlRooms').doc(id).update(updates)

    const updatedDoc = await adminDb.collection('controlRooms').doc(id).get()

    return NextResponse.json({ controlRoom: updatedDoc.data() }, { status: 200 })
  } catch (error) {
    console.error('Update control room error:', error)
    return NextResponse.json({ error: 'Failed to update control room' }, { status: 500 })
  }
}
