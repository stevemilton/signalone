import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import type { Alert, Escalation } from '@/types'

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

    // Verify the user is an operator or supervisor
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (!userData || !['operator', 'supervisor', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Only operators can escalate alerts' }, { status: 403 })
    }

    // Fetch the alert
    const alertDoc = await adminDb.collection('alerts').doc(id).get()
    if (!alertDoc.exists) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const alert = alertDoc.data() as Alert

    // Validate alert is in an active state
    if (['closed', 'cancelled', 'expired'].includes(alert.status)) {
      return NextResponse.json(
        { error: 'Cannot escalate a closed, cancelled, or expired alert' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const { service } = body

    // Validate service type
    const validServices: Escalation['service'][] = ['police', 'ambulance', 'fire', 'supervisor']
    if (!service || !validServices.includes(service)) {
      return NextResponse.json(
        { error: `Invalid service. Must be one of: ${validServices.join(', ')}` },
        { status: 400 }
      )
    }

    const now = Date.now()

    const escalation: Escalation = {
      service,
      timestamp: now,
      operatorId: auth.uid,
    }

    const logEntry = {
      timestamp: now,
      message: `Escalated to ${service} by ${userData.fullName}`,
      actor: 'operator' as const,
    }

    // Update alert with escalation
    await adminDb.collection('alerts').doc(id).update({
      escalations: [...(alert.escalations || []), escalation],
      incidentLog: [...(alert.incidentLog || []), logEntry],
    })

    // Fetch updated alert
    const updatedDoc = await adminDb.collection('alerts').doc(id).get()

    return NextResponse.json(
      {
        escalation,
        alert: updatedDoc.data(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Escalate alert error:', error)
    return NextResponse.json({ error: 'Failed to escalate alert' }, { status: 500 })
  }
}
