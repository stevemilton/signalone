import { NextResponse } from 'next/server'
import { adminDb, adminRtdb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import { generateReferenceNumber } from '@/lib/utils/format'
import type { Alert, Incident, AlertClassification, AlertStatus } from '@/types'

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
    const alertDoc = await adminDb.collection('alerts').doc(id).get()

    if (!alertDoc.exists) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const alert = alertDoc.data() as Alert

    // Citizens can only view their own alerts
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    const userRole = userDoc.data()?.role

    if (userRole === 'citizen' && alert.userId !== auth.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ alert }, { status: 200 })
  } catch (error) {
    console.error('Get alert error:', error)
    return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 })
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

    const { id } = await params
    const alertDoc = await adminDb.collection('alerts').doc(id).get()

    if (!alertDoc.exists) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const alert = alertDoc.data() as Alert
    const body = await request.json()
    const now = Date.now()

    const updates: Record<string, unknown> = {
      updatedAt: now,
    }

    // Handle status change
    if (body.status) {
      const validStatuses: AlertStatus[] = [
        'pending', 'awaiting_review', 'accepted', 'searching', 'monitoring', 'closed', 'cancelled', 'expired',
      ]
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      updates.status = body.status

      // Add incident log entry for status change
      const logEntry = {
        timestamp: now,
        message: `Status changed from "${alert.status}" to "${body.status}"`,
        actor: 'operator' as const,
      }
      updates.incidentLog = [...(alert.incidentLog || []), logEntry]

      // Handle specific status transitions
      if (body.status === 'accepted' && !alert.acceptedAt) {
        updates.acceptedAt = now
      }

      if (body.status === 'monitoring') {
        updates.locatedAt = now
      }

      // When closing, create incident record and clear RTDB
      if (body.status === 'closed') {
        updates.closedAt = now
        updates.duration = Math.floor((now - alert.createdAt) / 1000)

        // Create incident record
        const incidentRef = adminDb.collection('incidents').doc()
        const incidentData: Incident = {
          id: incidentRef.id,
          alertId: id,
          referenceNumber: generateReferenceNumber(),
          userId: alert.userId,
          operatorId: alert.operatorId || auth.uid,
          controlRoomId: alert.controlRoomId,
          alertType: alert.alertType,
          classification: (body.classification as AlertClassification) || alert.classification,
          operatorNotes: body.operatorNotes || alert.operatorNotes,
          escalations: alert.escalations || [],
          incidentLog: [
            ...(alert.incidentLog || []),
            {
              timestamp: now,
              message: 'Alert closed. Incident record created.',
              actor: 'system' as const,
            },
          ],
          location: alert.location,
          locationName: alert.locationName,
          duration: Math.floor((now - alert.createdAt) / 1000),
          createdAt: alert.createdAt,
          closedAt: now,
          reviewedBy: null,
          reviewedAt: null,
        }
        await incidentRef.set(incidentData)

        // Clear RTDB state
        await adminRtdb.ref(`activeAlerts/${id}`).remove()

        // Clear user's active alert
        await adminDb.collection('users').doc(alert.userId).update({
          activeAlertId: null,
          updatedAt: now,
        })

        // Free up operator
        if (alert.operatorId) {
          const operatorSnapshot = await adminDb
            .collection('operators')
            .where('userId', '==', alert.operatorId)
            .limit(1)
            .get()

          if (!operatorSnapshot.empty) {
            const opDoc = operatorSnapshot.docs[0]
            const opData = opDoc.data()
            const updatedActiveAlerts = (opData.activeAlerts || []).filter((aid: string) => aid !== id)
            await adminDb.collection('operators').doc(opDoc.id).update({
              activeAlerts: updatedActiveAlerts,
              status: updatedActiveAlerts.length === 0 ? 'available' : 'busy',
              alertsHandled: (opData.alertsHandled || 0) + 1,
            })
          }
        }
      }
    }

    // Handle operator status update
    if (body.operatorStatus) {
      updates.operatorStatus = body.operatorStatus
      // Update RTDB
      await adminRtdb.ref(`activeAlerts/${id}/operatorStatus`).set(body.operatorStatus)
      await adminRtdb.ref(`activeAlerts/${id}/updatedAt`).set(now)
    }

    // Handle classification update
    if (body.classification) {
      updates.classification = body.classification
    }

    // Handle operator notes update
    if (body.operatorNotes !== undefined) {
      updates.operatorNotes = body.operatorNotes
    }

    // Handle location update
    if (body.location) {
      updates.location = body.location
      await adminRtdb.ref(`activeAlerts/${id}/location`).set(body.location)
      await adminRtdb.ref(`activeAlerts/${id}/updatedAt`).set(now)
    }

    // Handle additional info update
    if (body.additionalInfo !== undefined) {
      updates.additionalInfo = body.additionalInfo
      await adminRtdb.ref(`activeAlerts/${id}/additionalInfo`).set(body.additionalInfo)
    }

    // Handle passenger feels safe update
    if (body.passengerFeelsSafe !== undefined) {
      updates.passengerFeelsSafe = body.passengerFeelsSafe
      await adminRtdb.ref(`activeAlerts/${id}/passengerFeelsSafe`).set(body.passengerFeelsSafe)
    }

    // Update RTDB status if status changed
    if (body.status && body.status !== 'closed') {
      await adminRtdb.ref(`activeAlerts/${id}/status`).set(body.status)
      await adminRtdb.ref(`activeAlerts/${id}/updatedAt`).set(now)
    }

    // Update Firestore
    await adminDb.collection('alerts').doc(id).update(updates)

    // Return updated alert
    const updatedDoc = await adminDb.collection('alerts').doc(id).get()

    return NextResponse.json({ alert: updatedDoc.data() }, { status: 200 })
  } catch (error) {
    console.error('Update alert error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}
