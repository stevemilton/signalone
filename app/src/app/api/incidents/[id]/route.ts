import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import { sendMaliciousWarningEmail } from '@/lib/email/send'
import type { Incident } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify non-citizen role
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (userData?.role === 'citizen') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const incidentDoc = await adminDb.collection('incidents').doc(id).get()

    if (!incidentDoc.exists) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const incident = incidentDoc.data() as Incident

    // Fetch related alert data
    const alertDoc = await adminDb.collection('alerts').doc(incident.alertId).get()
    const alert = alertDoc.exists ? alertDoc.data() : null

    // Fetch operator info
    let operator = null
    if (incident.operatorId) {
      const operatorDoc = await adminDb.collection('users').doc(incident.operatorId).get()
      if (operatorDoc.exists) {
        const opData = operatorDoc.data()
        operator = {
          id: opData?.id,
          fullName: opData?.fullName,
          role: opData?.role,
        }
      }
    }

    // Fetch user info (limited)
    let user = null
    if (incident.userId) {
      const citizenDoc = await adminDb.collection('users').doc(incident.userId).get()
      if (citizenDoc.exists) {
        const citizenData = citizenDoc.data()
        user = {
          id: citizenData?.id,
          fullName: citizenData?.fullName,
          phone: citizenData?.phone,
        }
      }
    }

    return NextResponse.json(
      {
        incident,
        alert,
        operator,
        user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get incident error:', error)
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 })
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

    // Verify supervisor or admin role
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (!userData || !['supervisor', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Supervisor or admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const incidentDoc = await adminDb.collection('incidents').doc(id).get()

    if (!incidentDoc.exists) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const body = await request.json()
    const now = Date.now()

    const updates: Record<string, unknown> = {}

    // Supervisor review fields
    if (body.classification) {
      const validClassifications = ['genuine', 'false_alert', 'malicious', 'unclear']
      if (!validClassifications.includes(body.classification)) {
        return NextResponse.json({ error: 'Invalid classification' }, { status: 400 })
      }
      updates.classification = body.classification
    }

    if (body.operatorNotes !== undefined) {
      updates.operatorNotes = body.operatorNotes
    }

    // Mark as reviewed
    if (body.reviewed === true) {
      updates.reviewedBy = auth.uid
      updates.reviewedAt = now
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await adminDb.collection('incidents').doc(id).update(updates)

    // If classification is malicious, potentially apply sanctions to the user
    if (body.classification === 'malicious') {
      const incident = incidentDoc.data() as Incident
      const citizenDoc = await adminDb.collection('users').doc(incident.userId).get()

      if (citizenDoc.exists) {
        const citizenData = citizenDoc.data()
        const currentSanction = citizenData?.sanctionLevel || 'none'

        // Escalate sanction level
        const sanctionEscalation: Record<string, { level: string; expiresAt: number | null }> = {
          none: { level: 'warning_1', expiresAt: null },
          warning_1: { level: 'warning_2', expiresAt: null },
          warning_2: { level: 'restricted', expiresAt: null },
          restricted: { level: 'banned_3m', expiresAt: now + (90 * 24 * 60 * 60 * 1000) },
          banned_3m: { level: 'banned_permanent', expiresAt: null },
        }

        const nextSanction = sanctionEscalation[currentSanction]
        if (nextSanction) {
          await adminDb.collection('users').doc(incident.userId).update({
            sanctionLevel: nextSanction.level,
            sanctionExpiresAt: nextSanction.expiresAt,
            updatedAt: now,
          })

          // Send warning/ban email (fire-and-forget)
          if (citizenData?.email) {
            sendMaliciousWarningEmail(citizenData, nextSanction.level)
          }
        }
      }
    }

    const updatedDoc = await adminDb.collection('incidents').doc(id).get()

    return NextResponse.json({ incident: updatedDoc.data() }, { status: 200 })
  } catch (error) {
    console.error('Update incident error:', error)
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
  }
}
