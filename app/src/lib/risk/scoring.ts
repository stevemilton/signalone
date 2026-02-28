// ============================================================
// Risk Intelligence Engine — Real-time Risk Scoring
// ============================================================

import type {
  RiskScoreParams,
  RiskScoreResponse,
  RiskFactor,
  RiskLevel,
  NearbyIncident,
  SpatialInsights,
  TemporalInsights,
  UserInsights,
  FalseAlarmPatterns,
  GeohashCell,
} from '@/types/risk'
import type { Alert } from '@/types/index'
import { encodeGeohash } from '@/lib/utils/geo'
import { geohashNeighbors, haversineDistance } from '@/lib/utils/geo'
import {
  GEOHASH_PRECISION,
  SCORE_WEIGHTS,
  USER_CATEGORY_SCORES,
  ALERT_TYPE_SCORES,
  FEELS_SAFE_SCORES,
  DEFAULT_LOCATION_SCORE,
  DEFAULT_RISK_SCORE,
  MAX_NEARBY_INCIDENTS,
  getRiskLevel,
} from './constants'

interface InsightsData {
  spatial: SpatialInsights | null
  temporal: TemporalInsights | null
  users: UserInsights | null
  falseAlarmPatterns: FalseAlarmPatterns | null
}

/**
 * Compute a real-time risk score using pre-aggregated insight data.
 * Falls back to neutral score (50) if no insights available.
 */
export function computeRiskScore(
  params: RiskScoreParams,
  insights: InsightsData
): Omit<RiskScoreResponse, 'nearbyIncidents'> {
  const hasInsights = insights.spatial || insights.temporal || insights.users

  if (!hasInsights) {
    return {
      score: DEFAULT_RISK_SCORE,
      level: getRiskLevel(DEFAULT_RISK_SCORE),
      factors: [],
      falseAlarmProbability: 0,
    }
  }

  const factors: RiskFactor[] = []

  // 1. Location factor
  const locationScore = computeLocationScore(params.lat, params.lng, insights.spatial)
  factors.push({
    name: 'Location',
    weight: SCORE_WEIGHTS.location,
    score: locationScore,
    weightedScore: Math.round(SCORE_WEIGHTS.location * locationScore),
    description: getLocationDescription(locationScore),
  })

  // 2. Time factor
  const timeScore = computeTimeScore(insights.temporal)
  factors.push({
    name: 'Time of day',
    weight: SCORE_WEIGHTS.time,
    score: timeScore,
    weightedScore: Math.round(SCORE_WEIGHTS.time * timeScore),
    description: getTimeDescription(timeScore),
  })

  // 3. User history factor
  const userScore = computeUserScore(params.userId, insights.users)
  factors.push({
    name: 'User history',
    weight: SCORE_WEIGHTS.userHistory,
    score: userScore,
    weightedScore: Math.round(SCORE_WEIGHTS.userHistory * userScore),
    description: getUserDescription(userScore, params.userId, insights.users),
  })

  // 4. Alert type factor
  const alertTypeScore = params.alertType
    ? (ALERT_TYPE_SCORES[params.alertType] ?? 50)
    : 50
  factors.push({
    name: 'Alert type',
    weight: SCORE_WEIGHTS.alertType,
    score: alertTypeScore,
    weightedScore: Math.round(SCORE_WEIGHTS.alertType * alertTypeScore),
    description: params.alertType === 'red' ? 'Red alert — higher severity' : 'Blue alert — standard',
  })

  // 5. Feels safe factor
  let feelsSafeScore: number
  if (params.passengerFeelsSafe === false) {
    feelsSafeScore = FEELS_SAFE_SCORES.false
  } else if (params.passengerFeelsSafe === true) {
    feelsSafeScore = FEELS_SAFE_SCORES.true
  } else {
    feelsSafeScore = FEELS_SAFE_SCORES.unset
  }
  factors.push({
    name: 'Passenger safety',
    weight: SCORE_WEIGHTS.feelsSafe,
    score: feelsSafeScore,
    weightedScore: Math.round(SCORE_WEIGHTS.feelsSafe * feelsSafeScore),
    description: params.passengerFeelsSafe === false
      ? 'Passenger does not feel safe'
      : params.passengerFeelsSafe === true
        ? 'Passenger feels safe'
        : 'Safety feeling not reported',
  })

  const totalScore = Math.round(factors.reduce((sum, f) => sum + f.weight * f.score, 0))
  const clampedScore = Math.max(0, Math.min(100, totalScore))

  // False alarm probability
  let falseAlarmProbability = 0
  if (insights.falseAlarmPatterns) {
    falseAlarmProbability = insights.falseAlarmPatterns.overallFalseAlarmRate
  }
  // Adjust based on user's personal false alarm rate
  if (params.userId && insights.users?.users[params.userId]) {
    const userProfile = insights.users.users[params.userId]
    falseAlarmProbability = (falseAlarmProbability + userProfile.falseAlarmRate) / 2
  }

  return {
    score: clampedScore,
    level: getRiskLevel(clampedScore),
    factors,
    falseAlarmProbability: Math.round(falseAlarmProbability * 100) / 100,
  }
}

/**
 * Find nearby incidents in the same geohash-6 cell + neighbours.
 */
export function findNearbyIncidents(
  lat: number,
  lng: number,
  recentAlerts: Alert[]
): NearbyIncident[] {
  const gh = encodeGeohash(lat, lng, GEOHASH_PRECISION)
  const relevantHashes = new Set([gh, ...geohashNeighbors(gh)])

  const nearby: NearbyIncident[] = []
  for (const alert of recentAlerts) {
    const alertGh = encodeGeohash(alert.location.lat, alert.location.lng, GEOHASH_PRECISION)
    if (!relevantHashes.has(alertGh)) continue

    const distance = haversineDistance(lat, lng, alert.location.lat, alert.location.lng)
    nearby.push({
      alertId: alert.id,
      alertType: alert.alertType,
      classification: alert.classification,
      locationName: alert.locationName,
      distanceMetres: Math.round(distance),
      createdAt: alert.createdAt,
    })
  }

  return nearby
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_NEARBY_INCIDENTS)
}

// --- Internal Helpers ---

function computeLocationScore(lat: number, lng: number, spatial: SpatialInsights | null): number {
  if (!spatial) return DEFAULT_LOCATION_SCORE

  const gh = encodeGeohash(lat, lng, GEOHASH_PRECISION)
  const cell = spatial.cells[gh]

  if (cell) return cell.riskScore

  // Check neighbours
  const neighbors = geohashNeighbors(gh)
  const neighborCells: GeohashCell[] = []
  for (const ngh of neighbors) {
    if (spatial.cells[ngh]) neighborCells.push(spatial.cells[ngh])
  }

  if (neighborCells.length > 0) {
    const avg = neighborCells.reduce((sum, c) => sum + c.riskScore, 0) / neighborCells.length
    return Math.round(avg * 0.7) // Discount neighbour data
  }

  return DEFAULT_LOCATION_SCORE
}

function computeTimeScore(temporal: TemporalInsights | null): number {
  if (!temporal) return 50

  const now = new Date()
  const hour = now.getHours()
  const day = (now.getDay() + 6) % 7 // Mon=0

  const hourWeight = temporal.hourlyProfile[hour] ?? 0
  const dayWeight = temporal.dayOfWeekProfile[day] ?? 0

  return Math.round((0.6 * hourWeight + 0.4 * dayWeight) * 100)
}

function computeUserScore(userId: string | undefined, users: UserInsights | null): number {
  if (!userId || !users) return USER_CATEGORY_SCORES.unknown

  const profile = users.users[userId]
  if (!profile) return USER_CATEGORY_SCORES.unknown

  return USER_CATEGORY_SCORES[profile.riskCategory] ?? USER_CATEGORY_SCORES.unknown
}

function getLocationDescription(score: number): string {
  if (score >= 75) return 'High-risk location — frequent incidents'
  if (score >= 50) return 'Elevated activity at this location'
  if (score >= 25) return 'Moderate location risk'
  return 'Low-risk location'
}

function getTimeDescription(score: number): string {
  if (score >= 75) return 'Peak incident time'
  if (score >= 50) return 'Above-average incident time'
  if (score >= 25) return 'Moderate time risk'
  return 'Low-risk time period'
}

function getUserDescription(score: number, userId: string | undefined, users: UserInsights | null): string {
  if (!userId || !users) return 'No user history available'
  const profile = users.users[userId]
  if (!profile) return 'First-time or infrequent user'
  if (profile.riskCategory === 'repeat_offender') return `Repeat false alerts (${profile.totalAlerts} total, ${Math.round(profile.falseAlarmRate * 100)}% false)`
  if (profile.riskCategory === 'high') return `High false alarm rate (${profile.totalAlerts} total)`
  if (profile.riskCategory === 'moderate') return `Some false alerts (${profile.totalAlerts} total)`
  return `Reliable user (${profile.totalAlerts} alerts, ${Math.round(profile.falseAlarmRate * 100)}% false)`
}
