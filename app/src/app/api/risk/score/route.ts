import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import { computeRiskScore, findNearbyIncidents } from '@/lib/risk/scoring'
import { GEOHASH_PRECISION, RISK_WINDOW_DAYS } from '@/lib/risk/constants'
import { encodeGeohash, geohashNeighbors } from '@/lib/utils/geo'
import type { Alert } from '@/types'
import type {
  SpatialInsights,
  TemporalInsights,
  UserInsights,
  FalseAlarmPatterns,
  RiskScoreParams,
} from '@/types/risk'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Operator, supervisor, admin
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    const user = userDoc.data()
    if (!user || !['operator', 'supervisor', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const userId = searchParams.get('userId') || undefined
    const alertType = searchParams.get('alertType') as 'blue' | 'red' | undefined
    const feelsSafeParam = searchParams.get('passengerFeelsSafe')

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
    }

    const params: RiskScoreParams = {
      lat,
      lng,
      userId,
      alertType: alertType && ['blue', 'red'].includes(alertType) ? alertType : undefined,
      passengerFeelsSafe: feelsSafeParam === 'true' ? true : feelsSafeParam === 'false' ? false : undefined,
    }

    // Read pre-computed insights (3 reads)
    const col = adminDb.collection('riskInsights')
    const [spatialDoc, temporalDoc, usersDoc, falseAlarmDoc] = await Promise.all([
      col.doc('spatial').get(),
      col.doc('temporal').get(),
      col.doc('users').get(),
      col.doc('falseAlarmPatterns').get(),
    ])

    const spatial = spatialDoc.exists ? (spatialDoc.data() as SpatialInsights) : null
    const temporal = temporalDoc.exists ? (temporalDoc.data() as TemporalInsights) : null
    const users = usersDoc.exists ? (usersDoc.data() as UserInsights) : null
    const falseAlarmPatterns = falseAlarmDoc.exists ? (falseAlarmDoc.data() as FalseAlarmPatterns) : null

    // Compute score
    const result = computeRiskScore(params, { spatial, temporal, users, falseAlarmPatterns })

    // Find nearby incidents — query recent alerts in same geohash area
    const gh = encodeGeohash(lat, lng, GEOHASH_PRECISION)
    const relevantHashes = [gh, ...geohashNeighbors(gh)]
    const windowStart = Date.now() - RISK_WINDOW_DAYS * 24 * 60 * 60 * 1000

    // Query recent closed alerts for nearby incidents
    const recentSnapshot = await adminDb
      .collection('alerts')
      .where('status', '==', 'closed')
      .where('createdAt', '>=', windowStart)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

    const recentAlerts = recentSnapshot.docs.map(doc => doc.data() as Alert)
    const nearbyIncidents = findNearbyIncidents(lat, lng, recentAlerts)

    return NextResponse.json({
      ...result,
      nearbyIncidents,
    })
  } catch (error) {
    console.error('Risk score error:', error)
    return NextResponse.json({ error: 'Failed to compute risk score' }, { status: 500 })
  }
}
