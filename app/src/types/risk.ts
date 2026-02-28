// ============================================================
// Risk Intelligence Engine — Type Definitions
// ============================================================

import type { AlertType, AlertClassification } from './index'

// --- Geohash Cell (spatial aggregation) ---

export interface GeohashCell {
  alertCount: number
  genuineCount: number
  falseAlertCount: number
  genuineRate: number
  avgResponseTimeSec: number
  peakHours: number[] // top-3 hours (0-23)
  dominantAlertType: AlertType
  redAlertCount: number
  blueAlertCount: number
  escalationCount: number
  lastAlertAt: number
  riskScore: number // 0-100
  centerLat: number
  centerLng: number
}

export interface Hotspot {
  geohash: string
  label: string // most common locationName in cell
  riskScore: number
  alertCount: number
  genuineRate: number
  centerLat: number
  centerLng: number
}

// --- Spatial Insights Document ---

export interface SpatialInsights {
  cells: Record<string, GeohashCell>
  hotspots: Hotspot[]
}

// --- Temporal Insights Document ---

export interface MonthlyTrend {
  month: string // YYYY-MM
  alertCount: number
  genuineRate: number
  avgResponseTimeSec: number
  redAlertRate: number
  escalationRate: number
}

export interface TemporalInsights {
  hourlyProfile: number[] // 24 normalised weights (0-1)
  dayOfWeekProfile: number[] // 7 normalised weights (Mon=0)
  hourDayHeatmap: number[][] // 7x24 matrix [day][hour]
  monthlyTrends: MonthlyTrend[]
}

// --- User Risk Profiles Document ---

export type UserRiskCategory = 'low' | 'moderate' | 'high' | 'repeat_offender'

export interface UserRiskProfile {
  totalAlerts: number
  genuineCount: number
  falseAlertCount: number
  maliciousCount: number
  falseAlarmRate: number
  lastAlertAt: number
  riskCategory: UserRiskCategory
}

export interface UserInsights {
  users: Record<string, UserRiskProfile>
}

// --- False Alarm Patterns Document ---

export interface FalseAlarmGeohash {
  geohash: string
  label: string
  falseAlertCount: number
  totalAlerts: number
  falseAlarmRate: number
}

export interface FalseAlarmUser {
  userId: string
  falseAlertCount: number
  totalAlerts: number
  falseAlarmRate: number
}

export interface FalseAlarmPatterns {
  overallFalseAlarmRate: number
  topFalseAlarmGeohashes: FalseAlarmGeohash[]
  topFalseAlarmUsers: FalseAlarmUser[]
  falseAlarmByHour: number[] // 24
  falseAlarmByDayOfWeek: number[] // 7
}

// --- Metadata Document ---

export interface RiskInsightsMetadata {
  lastComputedAt: number
  alertsAnalyzed: number
  windowStart: number
  windowEnd: number
  computeDurationMs: number
  version: number
}

// --- All Insights Combined ---

export interface RiskInsights {
  metadata: RiskInsightsMetadata
  spatial: SpatialInsights
  temporal: TemporalInsights
  users: UserInsights
  falseAlarmPatterns: FalseAlarmPatterns
}

// --- Risk Score API ---

export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high'

export interface RiskFactor {
  name: string
  weight: number
  score: number
  weightedScore: number
  description: string
}

export interface NearbyIncident {
  alertId: string
  alertType: AlertType
  classification: AlertClassification | null
  locationName: string
  distanceMetres: number
  createdAt: number
}

export interface RiskScoreResponse {
  score: number
  level: RiskLevel
  factors: RiskFactor[]
  nearbyIncidents: NearbyIncident[]
  falseAlarmProbability: number
}

export interface RiskScoreParams {
  lat: number
  lng: number
  userId?: string
  alertType?: AlertType
  passengerFeelsSafe?: boolean
}

// --- Compute API Response ---

export interface ComputeResponse {
  success: boolean
  alertsAnalyzed: number
  computeDurationMs: number
}
