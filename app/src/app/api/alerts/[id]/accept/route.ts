import { NextResponse } from 'next/server'
import { adminDb, adminRtdb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import { sendPushToUser } from '@/lib/firebase/push'
import { sendAlertAcceptedEmail } from '@/lib/email/send'
import type { Alert } from '@/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the user is an operator
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (!userData || !['operator', 'supervisor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Only operators can accept alerts' }, { status: 403 })
    }

    // Fetch the alert
    const alertDoc = await adminDb.collection('alerts').doc(id).get()
    if (!alertDoc.exists) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const alert = alertDoc.data() as Alert

    // Check alert can be accepted
    if (!['pending', 'awaiting_review'].includes(alert.status)) {
      return NextResponse.json(
        { error: `Alert cannot be accepted. Current status: ${alert.status}` },
        { status: 409 }
      )
    }

    // Check if alert is already accepted by another operator
    if (alert.operatorId && alert.operatorId !== auth.uid && alert.status === 'accepted') {
      return NextResponse.json(
        { error: 'Alert already accepted by another operator' },
        { status: 409 }
      )
    }

    const now = Date.now()

    // Update alert in Firestore
    const logEntry = {
      timestamp: now,
      message: `Alert accepted by operator ${userData.fullName}`,
      actor: 'operator' as const,
    }

    await adminDb.collection('alerts').doc(id).update({
      operatorId: auth.uid,
      status: 'accepted',
      operatorStatus: 'operator_searching',
      acceptedAt: now,
      incidentLog: [...(alert.incidentLog || []), logEntry],
    })

    // Update RTDB
    await adminRtdb.ref(`activeAlerts/${id}`).update({
      status: 'accepted',
      operatorStatus: 'operator_searching',
      updatedAt: now,
    })

    // Update operator record
    const operatorSnapshot = await adminDb
      .collection('operators')
      .where('userId', '==', auth.uid)
      .limit(1)
      .get()

    if (!operatorSnapshot.empty) {
      const opDoc = operatorSnapshot.docs[0]
      const opData = opDoc.data()
      await adminDb.collection('operators').doc(opDoc.id).update({
        status: 'busy',
        activeAlerts: [...(opData.activeAlerts || []), id],
      })
    }

    // Send push notification to citizen (fire-and-forget)
    sendPushToUser(alert.userId, {
      title: 'Alert Accepted',
      body: `An operator is now monitoring your alert`,
      url: '/alert/monitoring',
    })

    // Send email notification to citizen (fire-and-forget)
    const citizenDoc = await adminDb.collection('users').doc(alert.userId).get()
    if (citizenDoc.data()?.email) {
      sendAlertAcceptedEmail(citizenDoc.data()!, alert)
    }

    // Fetch updated alert
    const updatedDoc = await adminDb.collection('alerts').doc(id).get()

    return NextResponse.json({ alert: updatedDoc.data() }, { status: 200 })
  } catch (error) {
    console.error('Accept alert error:', error)
    return NextResponse.json({ error: 'Failed to accept alert' }, { status: 500 })
  }
}
