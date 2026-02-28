import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import type {
  RiskInsightsMetadata,
  SpatialInsights,
  TemporalInsights,
  UserInsights,
  FalseAlarmPatterns,
} from '@/types/risk'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin and supervisor only
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    const user = userDoc.data()
    if (!user || !['admin', 'supervisor'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const col = adminDb.collection('riskInsights')
    const [metadataDoc, spatialDoc, temporalDoc, usersDoc, falseAlarmDoc] = await Promise.all([
      col.doc('metadata').get(),
      col.doc('spatial').get(),
      col.doc('temporal').get(),
      col.doc('users').get(),
      col.doc('falseAlarmPatterns').get(),
    ])

    if (!metadataDoc.exists) {
      return NextResponse.json({
        computed: false,
        message: 'Risk insights have not been computed yet. Trigger a recomputation from the admin panel.',
      })
    }

    return NextResponse.json({
      computed: true,
      metadata: metadataDoc.data() as RiskInsightsMetadata,
      spatial: spatialDoc.exists ? (spatialDoc.data() as SpatialInsights) : null,
      temporal: temporalDoc.exists ? (temporalDoc.data() as TemporalInsights) : null,
      users: usersDoc.exists ? (usersDoc.data() as UserInsights) : null,
      falseAlarmPatterns: falseAlarmDoc.exists ? (falseAlarmDoc.data() as FalseAlarmPatterns) : null,
    })
  } catch (error) {
    console.error('Risk insights error:', error)
    return NextResponse.json({ error: 'Failed to fetch risk insights' }, { status: 500 })
  }
}
