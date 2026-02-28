'use client'

import { useState, useEffect, useCallback } from 'react'
import { auth as firebaseAuth } from '@/lib/firebase/config'
import type {
  RiskInsightsMetadata,
  SpatialInsights,
  TemporalInsights,
  UserInsights,
  FalseAlarmPatterns,
} from '@/types/risk'

interface RiskInsightsData {
  computed: boolean
  metadata: RiskInsightsMetadata | null
  spatial: SpatialInsights | null
  temporal: TemporalInsights | null
  users: UserInsights | null
  falseAlarmPatterns: FalseAlarmPatterns | null
}

interface UseRiskInsightsResult {
  data: RiskInsightsData | null
  loading: boolean
  error: string | null
  recomputing: boolean
  refresh: () => Promise<void>
  recompute: () => Promise<void>
}

export function useRiskInsights(): UseRiskInsightsResult {
  const [data, setData] = useState<RiskInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recomputing, setRecomputing] = useState(false)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const idToken = await firebaseAuth.currentUser?.getIdToken()
      if (!idToken) {
        setError('Not authenticated')
        return
      }

      const res = await fetch('/api/risk/insights', {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed (${res.status})`)
      }

      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk insights')
    } finally {
      setLoading(false)
    }
  }, [])

  const recompute = useCallback(async () => {
    setRecomputing(true)
    setError(null)

    try {
      const idToken = await firebaseAuth.currentUser?.getIdToken()
      if (!idToken) {
        setError('Not authenticated')
        return
      }

      const res = await fetch('/api/risk/compute', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Recompute failed (${res.status})`)
      }

      // Refresh insights after recomputation
      await fetchInsights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recompute')
    } finally {
      setRecomputing(false)
    }
  }, [fetchInsights])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return { data, loading, error, recomputing, refresh: fetchInsights, recompute }
}
