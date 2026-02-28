'use client'

import { useState, useEffect } from 'react'
import { auth as firebaseAuth } from '@/lib/firebase/config'
import type { RiskScoreResponse, RiskLevel } from '@/types/risk'

interface UseRiskScoreParams {
  lat?: number
  lng?: number
  userId?: string
  alertType?: 'blue' | 'red'
  passengerFeelsSafe?: boolean
  enabled?: boolean
}

interface UseRiskScoreResult {
  data: RiskScoreResponse | null
  loading: boolean
  error: string | null
}

export function useRiskScore({
  lat,
  lng,
  userId,
  alertType,
  passengerFeelsSafe,
  enabled = true,
}: UseRiskScoreParams): UseRiskScoreResult {
  const [data, setData] = useState<RiskScoreResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || lat == null || lng == null) return

    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const idToken = await firebaseAuth.currentUser?.getIdToken()
        if (!idToken || cancelled) return

        const params = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
        })
        if (userId) params.set('userId', userId)
        if (alertType) params.set('alertType', alertType)
        if (passengerFeelsSafe !== undefined) params.set('passengerFeelsSafe', String(passengerFeelsSafe))

        const res = await fetch(`/api/risk/score?${params}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Risk score request failed (${res.status})`)
        }

        const result = await res.json()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch risk score')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [lat, lng, userId, alertType, passengerFeelsSafe, enabled])

  return { data, loading, error }
}
