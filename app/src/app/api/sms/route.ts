import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { alertId, recipientPhone, recipientName, message } = body

    // Validate required fields
    if (!alertId || !recipientPhone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, recipientPhone, message' },
        { status: 400 }
      )
    }

    // Validate phone number format (basic UK validation)
    const phoneRegex = /^(\+44|0)\d{9,10}$/
    const cleanedPhone = recipientPhone.replace(/\s+/g, '')
    if (!phoneRegex.test(cleanedPhone)) {
      return NextResponse.json(
        { error: 'Invalid UK phone number format. Use +44XXXXXXXXXX or 0XXXXXXXXXXX' },
        { status: 400 }
      )
    }

    // Verify the alert exists
    const alertDoc = await adminDb.collection('alerts').doc(alertId).get()
    if (!alertDoc.exists) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Placeholder SMS implementation — logs to console
    // In production, replace with Twilio integration
    const smsPayload = {
      to: cleanedPhone,
      recipientName: recipientName || 'Emergency Contact',
      message,
      alertId,
      sentBy: auth.uid,
      sentAt: new Date().toISOString(),
    }

    console.log('=== SMS NOTIFICATION (Placeholder) ===')
    console.log(`To: ${smsPayload.to} (${smsPayload.recipientName})`)
    console.log(`Message: ${smsPayload.message}`)
    console.log(`Alert ID: ${smsPayload.alertId}`)
    console.log(`Sent by: ${smsPayload.sentBy}`)
    console.log(`Sent at: ${smsPayload.sentAt}`)
    console.log('======================================')

    // Log the SMS attempt in Firestore for auditing
    const smsLogRef = adminDb.collection('smsLogs').doc()
    await smsLogRef.set({
      id: smsLogRef.id,
      alertId,
      recipientPhone: cleanedPhone,
      recipientName: recipientName || 'Emergency Contact',
      message,
      sentBy: auth.uid,
      status: 'sent_placeholder', // Will be 'sent', 'delivered', 'failed' with real Twilio
      twilioSid: null, // Will contain Twilio message SID in production
      createdAt: Date.now(),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'SMS notification queued (placeholder — check server logs)',
        smsLogId: smsLogRef.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('SMS send error:', error)
    return NextResponse.json({ error: 'Failed to send SMS notification' }, { status: 500 })
  }
}
