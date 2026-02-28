import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify operator/supervisor/admin role
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (userData?.role === 'citizen') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const controlRoomId = searchParams.get('controlRoomId')
    const classification = searchParams.get('classification')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const alertType = searchParams.get('alertType')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    let query: FirebaseFirestore.Query = adminDb.collection('incidents')

    // Apply filters
    if (controlRoomId) {
      query = query.where('controlRoomId', '==', controlRoomId)
    }

    if (classification) {
      query = query.where('classification', '==', classification)
    }

    if (alertType) {
      query = query.where('alertType', '==', alertType)
    }

    if (dateFrom) {
      const fromTimestamp = new Date(dateFrom).getTime()
      query = query.where('createdAt', '>=', fromTimestamp)
    }

    if (dateTo) {
      const toTimestamp = new Date(dateTo).getTime() + 86400000 // End of day
      query = query.where('createdAt', '<=', toTimestamp)
    }

    // Order and paginate
    query = query.orderBy('createdAt', 'desc')

    // Calculate offset for pagination
    const offset = (page - 1) * limit
    if (offset > 0) {
      query = query.offset(offset)
    }

    query = query.limit(Math.min(limit, 100))

    const snapshot = await query.get()
    const incidents = snapshot.docs.map((doc) => doc.data())

    // Get total count for pagination (use a separate count query)
    let totalQuery: FirebaseFirestore.Query = adminDb.collection('incidents')
    if (controlRoomId) {
      totalQuery = totalQuery.where('controlRoomId', '==', controlRoomId)
    }
    if (classification) {
      totalQuery = totalQuery.where('classification', '==', classification)
    }
    if (alertType) {
      totalQuery = totalQuery.where('alertType', '==', alertType)
    }

    const countSnapshot = await totalQuery.count().get()
    const total = countSnapshot.data().count

    return NextResponse.json(
      {
        incidents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get incidents error:', error)
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}
