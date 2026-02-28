import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import { computeRiskInsights } from '@/lib/risk/engine'
import { RISK_WINDOW_DAYS } from '@/lib/risk/constants'
import type { Alert } from '@/types'

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    const user = userDoc.data()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
    }

    const startTime = Date.now()
    const windowStart = Date.now() - RISK_WINDOW_DAYS * 24 * 60 * 60 * 1000

    // Fetch all alerts from last 90 days
    const snapshot = await adminDb
      .collection('alerts')
      .where('createdAt', '>=', windowStart)
      .orderBy('createdAt', 'desc')
      .get()

    const alerts = snapshot.docs.map(doc => doc.data() as Alert)

    // Compute insights
    const insights = computeRiskInsights(alerts)

    // Write 5 documents (idempotent — overwrites each run)
    const batch = adminDb.batch()
    const col = adminDb.collection('riskInsights')

    batch.set(col.doc('metadata'), insights.metadata)
    batch.set(col.doc('spatial'), insights.spatial)
    batch.set(col.doc('temporal'), insights.temporal)
    batch.set(col.doc('users'), insights.users)
    batch.set(col.doc('falseAlarmPatterns'), insights.falseAlarmPatterns)

    await batch.commit()

    const computeDurationMs = Date.now() - startTime

    return NextResponse.json({
      success: true,
      alertsAnalyzed: alerts.length,
      computeDurationMs,
    })
  } catch (error) {
    console.error('Risk compute error:', error)
    return NextResponse.json({ error: 'Failed to compute risk insights' }, { status: 500 })
  }
}
