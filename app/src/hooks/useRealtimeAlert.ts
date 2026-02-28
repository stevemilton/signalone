'use client'

import { useEffect, useCallback } from 'react'
import { ref, onValue, set, update, off } from 'firebase/database'
import { rtdb } from '@/lib/firebase/config'
import { useAlertStore } from '@/stores/alert-store'
import type { RealtimeAlertState, OperatorStatus } from '@/types'

export function useRealtimeAlert(alertId: string | null) {
  const { setRealtimeState, setWorkflowStep } = useAlertStore()

  useEffect(() => {
    if (!alertId) return

    const alertRef = ref(rtdb, `activeAlerts/${alertId}`)
    const unsubscribe = onValue(alertRef, (snapshot) => {
      const data = snapshot.val() as RealtimeAlertState | null
      if (data) {
        setRealtimeState(data)

        // Update workflow step based on operator status
        if (data.operatorStatus === 'operator_searching') {
          setWorkflowStep(3)
        } else if (data.operatorStatus === 'visual_confirmed') {
          setWorkflowStep(4)
        } else if (data.status === 'awaiting_review') {
          setWorkflowStep(2)
        }
      }
    })

    return () => off(alertRef)
  }, [alertId, setRealtimeState, setWorkflowStep])

  const updateAdditionalInfo = useCallback(
    async (info: string) => {
      if (!alertId) return
      await update(ref(rtdb, `activeAlerts/${alertId}`), {
        additionalInfo: info,
        updatedAt: Date.now(),
      })
    },
    [alertId]
  )

  const markFeelsSafe = useCallback(async () => {
    if (!alertId) return
    await update(ref(rtdb, `activeAlerts/${alertId}`), {
      passengerFeelsSafe: true,
      updatedAt: Date.now(),
    })
  }, [alertId])

  const updateOperatorStatus = useCallback(
    async (status: OperatorStatus) => {
      if (!alertId) return
      await update(ref(rtdb, `activeAlerts/${alertId}`), {
        operatorStatus: status,
        updatedAt: Date.now(),
      })
    },
    [alertId]
  )

  const createRealtimeAlert = useCallback(
    async (state: RealtimeAlertState) => {
      if (!alertId) return
      await set(ref(rtdb, `activeAlerts/${alertId}`), state)
    },
    [alertId]
  )

  const clearRealtimeAlert = useCallback(async () => {
    if (!alertId) return
    await set(ref(rtdb, `activeAlerts/${alertId}`), null)
  }, [alertId])

  return {
    updateAdditionalInfo,
    markFeelsSafe,
    updateOperatorStatus,
    createRealtimeAlert,
    clearRealtimeAlert,
  }
}
