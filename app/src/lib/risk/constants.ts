// ============================================================
// Risk Intelligence Engine — Constants & Configuration
// ============================================================

import type { RiskLevel } from '@/types/risk'

/** Analysis window in days */
export const RISK_WINDOW_DAYS = 90

/** Geohash precision for spatial cells (~1.2km) */
export const GEOHASH_PRECISION = 6

/** Max hotspots to store */
export const MAX_HOTSPOTS = 20

/** Top false alarm entries to store */
export const MAX_FALSE_ALARM_ENTRIES = 10

/** Current insights schema version */
export const INSIGHTS_VERSION = 1

// --- Risk Score Weights ---

export const SCORE_WEIGHTS = {
  location: 0.30,
  time: 0.20,
  userHistory: 0.25,
  alertType: 0.15,
  feelsSafe: 0.10,
} as const

// --- Cell Risk Score Weights ---

export const CELL_SCORE_WEIGHTS = {
  alertCount: 0.35,
  genuineRate: 0.25,
  redAlertCount: 0.20,
  escalationCount: 0.10,
  recency: 0.10,
} as const

// --- User Risk Category Scores (lower = more risky) ---

export const USER_CATEGORY_SCORES: Record<string, number> = {
  repeat_offender: 10,
  high: 30,
  moderate: 50,
  low: 70,
  unknown: 70,
}

// --- Alert Type Scores ---

export const ALERT_TYPE_SCORES: Record<string, number> = {
  red: 85,
  blue: 50,
}

// --- Feels Safe Scores ---

export const FEELS_SAFE_SCORES = {
  false: 90,
  true: 30,
  unset: 50,
} as const

// --- Default Scores ---

export const DEFAULT_LOCATION_SCORE = 25
export const DEFAULT_RISK_SCORE = 50

// --- Risk Level Thresholds ---

export const RISK_LEVELS: { max: number; level: RiskLevel }[] = [
  { max: 25, level: 'low' },
  { max: 50, level: 'moderate' },
  { max: 75, level: 'elevated' },
  { max: 100, level: 'high' },
]

export function getRiskLevel(score: number): RiskLevel {
  for (const { max, level } of RISK_LEVELS) {
    if (score <= max) return level
  }
  return 'high'
}

// --- User Risk Category Thresholds ---

export const USER_RISK_THRESHOLDS = {
  /** Min alerts to be flagged at all */
  minAlerts: 2,
  /** False alarm rate above this = repeat_offender */
  repeatOffenderRate: 0.7,
  /** False alarm rate above this = high */
  highRate: 0.5,
  /** False alarm rate above this = moderate */
  moderateRate: 0.3,
  /** Any malicious alerts = high */
  maliciousThreshold: 1,
} as const

/** Max nearby incidents to return from score endpoint */
export const MAX_NEARBY_INCIDENTS = 5
