// ============================================================
// Risk Intelligence Engine — Batch Aggregation
// ============================================================

import type { Alert, AlertClassification } from '@/types/index'
import type {
  RiskInsights,
  GeohashCell,
  Hotspot,
  SpatialInsights,
  TemporalInsights,
  UserInsights,
  UserRiskProfile,
  UserRiskCategory,
  FalseAlarmPatterns,
  FalseAlarmGeohash,
  FalseAlarmUser,
  MonthlyTrend,
  RiskInsightsMetadata,
} from '@/types/risk'
import { encodeGeohash, decodeGeohash } from '@/lib/utils/geo'
import {
  GEOHASH_PRECISION,
  MAX_HOTSPOTS,
  MAX_FALSE_ALARM_ENTRIES,
  INSIGHTS_VERSION,
  CELL_SCORE_WEIGHTS,
  USER_RISK_THRESHOLDS,
} from './constants'

// --- Helpers ---

function normalize(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(value / max, 1)
}

function normalizeArray(arr: number[]): number[] {
  const max = Math.max(...arr)
  if (max === 0) return arr.map(() => 0)
  return arr.map(v => v / max)
}

function getUserRiskCategory(profile: {
  totalAlerts: number
  falseAlarmRate: number
  maliciousCount: number
}): UserRiskCategory {
  if (profile.maliciousCount >= USER_RISK_THRESHOLDS.maliciousThreshold) return 'high'
  if (profile.falseAlarmRate >= USER_RISK_THRESHOLDS.repeatOffenderRate) return 'repeat_offender'
  if (profile.falseAlarmRate >= USER_RISK_THRESHOLDS.highRate) return 'high'
  if (profile.falseAlarmRate >= USER_RISK_THRESHOLDS.moderateRate) return 'moderate'
  return 'low'
}

function getTopN<T>(arr: T[], n: number, scoreFn: (item: T) => number): T[] {
  return [...arr].sort((a, b) => scoreFn(b) - scoreFn(a)).slice(0, n)
}

function getResponseTimeSec(alert: Alert): number | null {
  if (!alert.acceptedAt || !alert.createdAt) return null
  return (alert.acceptedAt - alert.createdAt) / 1000
}

function isFalseAlert(c: AlertClassification | null): boolean {
  return c === 'false_alert'
}

function isGenuine(c: AlertClassification | null): boolean {
  return c === 'genuine'
}

function isMalicious(c: AlertClassification | null): boolean {
  return c === 'malicious'
}

// --- Main Engine ---

export function computeRiskInsights(alerts: Alert[]): RiskInsights {
  const startTime = Date.now()
  const now = Date.now()

  // Only consider closed alerts with classification for most metrics
  const closedAlerts = alerts.filter(a => a.status === 'closed')

  // --- Spatial Aggregation ---
  const cellMap = new Map<string, {
    alerts: Alert[]
    locationNames: Map<string, number>
  }>()

  for (const alert of alerts) {
    const gh = encodeGeohash(alert.location.lat, alert.location.lng, GEOHASH_PRECISION)
    if (!cellMap.has(gh)) {
      cellMap.set(gh, { alerts: [], locationNames: new Map() })
    }
    const cell = cellMap.get(gh)!
    cell.alerts.push(alert)
    const name = alert.locationName || 'Unknown'
    cell.locationNames.set(name, (cell.locationNames.get(name) || 0) + 1)
  }

  // Find global maxes for normalization
  let maxAlertCount = 0
  let maxRedCount = 0
  let maxEscalationCount = 0

  for (const [, data] of cellMap) {
    const redCount = data.alerts.filter(a => a.alertType === 'red').length
    const escCount = data.alerts.reduce((sum, a) => sum + (a.escalations?.length || 0), 0)
    maxAlertCount = Math.max(maxAlertCount, data.alerts.length)
    maxRedCount = Math.max(maxRedCount, redCount)
    maxEscalationCount = Math.max(maxEscalationCount, escCount)
  }

  const cells: Record<string, GeohashCell> = {}
  const hotspotCandidates: { geohash: string; label: string; cell: GeohashCell }[] = []

  for (const [gh, data] of cellMap) {
    const cellAlerts = data.alerts
    const genuineCount = cellAlerts.filter(a => isGenuine(a.classification)).length
    const falseAlertCount = cellAlerts.filter(a => isFalseAlert(a.classification)).length
    const classifiedCount = genuineCount + falseAlertCount +
      cellAlerts.filter(a => isMalicious(a.classification)).length
    const genuineRate = classifiedCount > 0 ? genuineCount / classifiedCount : 0
    const redAlertCount = cellAlerts.filter(a => a.alertType === 'red').length
    const blueAlertCount = cellAlerts.filter(a => a.alertType === 'blue').length
    const escalationCount = cellAlerts.reduce((sum, a) => sum + (a.escalations?.length || 0), 0)

    // Avg response time
    const responseTimes = cellAlerts.map(getResponseTimeSec).filter((t): t is number => t !== null)
    const avgResponseTimeSec = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0

    // Peak hours
    const hourCounts = new Array(24).fill(0)
    for (const a of cellAlerts) {
      hourCounts[new Date(a.createdAt).getHours()]++
    }
    const peakHours = hourCounts
      .map((count, hour) => ({ count, hour }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour)

    const dominantAlertType = redAlertCount >= blueAlertCount ? 'red' : 'blue'
    const lastAlertAt = Math.max(...cellAlerts.map(a => a.createdAt))

    // Cell risk score
    const recencyBoost = normalize(
      Math.max(0, 1 - (now - lastAlertAt) / (90 * 24 * 60 * 60 * 1000)),
      1
    )
    const riskScore = Math.round(
      (CELL_SCORE_WEIGHTS.alertCount * normalize(cellAlerts.length, maxAlertCount) +
        CELL_SCORE_WEIGHTS.genuineRate * genuineRate +
        CELL_SCORE_WEIGHTS.redAlertCount * normalize(redAlertCount, maxRedCount) +
        CELL_SCORE_WEIGHTS.escalationCount * normalize(escalationCount, maxEscalationCount) +
        CELL_SCORE_WEIGHTS.recency * recencyBoost) * 100
    )

    const center = decodeGeohash(gh)

    const cell: GeohashCell = {
      alertCount: cellAlerts.length,
      genuineCount,
      falseAlertCount,
      genuineRate: Math.round(genuineRate * 100) / 100,
      avgResponseTimeSec: Math.round(avgResponseTimeSec),
      peakHours,
      dominantAlertType,
      redAlertCount,
      blueAlertCount,
      escalationCount,
      lastAlertAt,
      riskScore,
      centerLat: center.lat,
      centerLng: center.lng,
    }

    cells[gh] = cell

    // Most common location name
    let topLabel = 'Unknown'
    let topCount = 0
    for (const [name, count] of data.locationNames) {
      if (count > topCount) {
        topLabel = name
        topCount = count
      }
    }

    hotspotCandidates.push({ geohash: gh, label: topLabel, cell })
  }

  const hotspots: Hotspot[] = getTopN(hotspotCandidates, MAX_HOTSPOTS, h => h.cell.riskScore)
    .map(h => ({
      geohash: h.geohash,
      label: h.label,
      riskScore: h.cell.riskScore,
      alertCount: h.cell.alertCount,
      genuineRate: h.cell.genuineRate,
      centerLat: h.cell.centerLat,
      centerLng: h.cell.centerLng,
    }))

  const spatial: SpatialInsights = { cells, hotspots }

  // --- Temporal Aggregation ---
  const hourCounts = new Array(24).fill(0)
  const dayCounts = new Array(7).fill(0)
  const hourDayHeatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))

  for (const alert of alerts) {
    const d = new Date(alert.createdAt)
    const hour = d.getHours()
    const day = (d.getDay() + 6) % 7 // Mon=0
    hourCounts[hour]++
    dayCounts[day]++
    hourDayHeatmap[day][hour]++
  }

  const hourlyProfile = normalizeArray(hourCounts)
  const dayOfWeekProfile = normalizeArray(dayCounts)

  // Monthly trends (last 3 months)
  const monthMap = new Map<string, Alert[]>()
  for (const alert of alerts) {
    const d = new Date(alert.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) monthMap.set(key, [])
    monthMap.get(key)!.push(alert)
  }

  const sortedMonths = [...monthMap.keys()].sort().slice(-3)
  const monthlyTrends: MonthlyTrend[] = sortedMonths.map(month => {
    const monthAlerts = monthMap.get(month)!
    const classified = monthAlerts.filter(a => a.classification)
    const genuine = monthAlerts.filter(a => isGenuine(a.classification)).length
    const genuineRateMonth = classified.length > 0 ? genuine / classified.length : 0
    const redCount = monthAlerts.filter(a => a.alertType === 'red').length
    const escCount = monthAlerts.reduce((sum, a) => sum + (a.escalations?.length || 0), 0)
    const rts = monthAlerts.map(getResponseTimeSec).filter((t): t is number => t !== null)
    const avgRt = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0

    return {
      month,
      alertCount: monthAlerts.length,
      genuineRate: Math.round(genuineRateMonth * 100) / 100,
      avgResponseTimeSec: Math.round(avgRt),
      redAlertRate: monthAlerts.length > 0
        ? Math.round((redCount / monthAlerts.length) * 100) / 100
        : 0,
      escalationRate: monthAlerts.length > 0
        ? Math.round((escCount / monthAlerts.length) * 100) / 100
        : 0,
    }
  })

  const temporal: TemporalInsights = {
    hourlyProfile,
    dayOfWeekProfile,
    hourDayHeatmap,
    monthlyTrends,
  }

  // --- User Risk Profiles ---
  const userMap = new Map<string, Alert[]>()
  for (const alert of alerts) {
    if (!userMap.has(alert.userId)) userMap.set(alert.userId, [])
    userMap.get(alert.userId)!.push(alert)
  }

  const usersRecord: Record<string, UserRiskProfile> = {}
  for (const [userId, userAlerts] of userMap) {
    if (userAlerts.length < USER_RISK_THRESHOLDS.minAlerts) continue

    const genuine = userAlerts.filter(a => isGenuine(a.classification)).length
    const falseAlert = userAlerts.filter(a => isFalseAlert(a.classification)).length
    const malicious = userAlerts.filter(a => isMalicious(a.classification)).length
    const classified = genuine + falseAlert + malicious
    const falseAlarmRate = classified > 0 ? falseAlert / classified : 0

    const profile: UserRiskProfile = {
      totalAlerts: userAlerts.length,
      genuineCount: genuine,
      falseAlertCount: falseAlert,
      maliciousCount: malicious,
      falseAlarmRate: Math.round(falseAlarmRate * 100) / 100,
      lastAlertAt: Math.max(...userAlerts.map(a => a.createdAt)),
      riskCategory: getUserRiskCategory({ totalAlerts: userAlerts.length, falseAlarmRate, maliciousCount: malicious }),
    }

    usersRecord[userId] = profile
  }

  const users: UserInsights = { users: usersRecord }

  // --- False Alarm Patterns ---
  const falseAlerts = alerts.filter(a => isFalseAlert(a.classification))
  const totalClassified = closedAlerts.filter(a => a.classification).length
  const overallFalseAlarmRate = totalClassified > 0
    ? Math.round((falseAlerts.length / totalClassified) * 100) / 100
    : 0

  // False alarm by geohash
  const falseByGeo = new Map<string, { count: number; total: number; label: string }>()
  for (const [gh, data] of cellMap) {
    const falseCount = data.alerts.filter(a => isFalseAlert(a.classification)).length
    if (falseCount > 0) {
      let topLabel = 'Unknown'
      let topCount = 0
      for (const [name, count] of data.locationNames) {
        if (count > topCount) { topLabel = name; topCount = count }
      }
      falseByGeo.set(gh, { count: falseCount, total: data.alerts.length, label: topLabel })
    }
  }

  const topFalseAlarmGeohashes: FalseAlarmGeohash[] = getTopN(
    [...falseByGeo.entries()].map(([geohash, d]) => ({
      geohash,
      label: d.label,
      falseAlertCount: d.count,
      totalAlerts: d.total,
      falseAlarmRate: Math.round((d.count / d.total) * 100) / 100,
    })),
    MAX_FALSE_ALARM_ENTRIES,
    g => g.falseAlertCount
  )

  // False alarm by user
  const falseByUser = new Map<string, { count: number; total: number }>()
  for (const [userId, userAlerts] of userMap) {
    const falseCount = userAlerts.filter(a => isFalseAlert(a.classification)).length
    if (falseCount > 0) {
      falseByUser.set(userId, { count: falseCount, total: userAlerts.length })
    }
  }

  const topFalseAlarmUsers: FalseAlarmUser[] = getTopN(
    [...falseByUser.entries()].map(([userId, d]) => ({
      userId,
      falseAlertCount: d.count,
      totalAlerts: d.total,
      falseAlarmRate: Math.round((d.count / d.total) * 100) / 100,
    })),
    MAX_FALSE_ALARM_ENTRIES,
    u => u.falseAlertCount
  )

  // False alarm by hour/day
  const falseByHour = new Array(24).fill(0)
  const falseByDay = new Array(7).fill(0)
  for (const alert of falseAlerts) {
    const d = new Date(alert.createdAt)
    falseByHour[d.getHours()]++
    falseByDay[(d.getDay() + 6) % 7]++
  }

  const falseAlarmPatterns: FalseAlarmPatterns = {
    overallFalseAlarmRate,
    topFalseAlarmGeohashes,
    topFalseAlarmUsers,
    falseAlarmByHour: falseByHour,
    falseAlarmByDayOfWeek: falseByDay,
  }

  // --- Metadata ---
  const timestamps = alerts.map(a => a.createdAt)
  const metadata: RiskInsightsMetadata = {
    lastComputedAt: now,
    alertsAnalyzed: alerts.length,
    windowStart: timestamps.length > 0 ? Math.min(...timestamps) : now,
    windowEnd: timestamps.length > 0 ? Math.max(...timestamps) : now,
    computeDurationMs: Date.now() - startTime,
    version: INSIGHTS_VERSION,
  }

  return { metadata, spatial, temporal, users, falseAlarmPatterns }
}
