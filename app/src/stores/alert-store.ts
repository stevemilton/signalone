import { create } from 'zustand'
import type { Alert, AlertType, OperatorStatus, RealtimeAlertState } from '@/types'

interface AlertState {
  activeAlert: Alert | null
  realtimeState: RealtimeAlertState | null
  workflowStep: number
  alertType: AlertType | null
  holdTimer: number | null
  alertStartTime: number | null
  monitoringTimeRemaining: number
  setActiveAlert: (alert: Alert | null) => void
  setRealtimeState: (state: RealtimeAlertState | null) => void
  setWorkflowStep: (step: number) => void
  setAlertType: (type: AlertType | null) => void
  setHoldTimer: (timer: number | null) => void
  setAlertStartTime: (time: number | null) => void
  setMonitoringTimeRemaining: (seconds: number) => void
  reset: () => void
}

export const useAlertStore = create<AlertState>((set) => ({
  activeAlert: null,
  realtimeState: null,
  workflowStep: 1,
  alertType: null,
  holdTimer: null,
  alertStartTime: null,
  monitoringTimeRemaining: 1800,
  setActiveAlert: (alert) => set({ activeAlert: alert }),
  setRealtimeState: (state) => set({ realtimeState: state }),
  setWorkflowStep: (step) => set({ workflowStep: step }),
  setAlertType: (type) => set({ alertType: type }),
  setHoldTimer: (timer) => set({ holdTimer: timer }),
  setAlertStartTime: (time) => set({ alertStartTime: time }),
  setMonitoringTimeRemaining: (seconds) => set({ monitoringTimeRemaining: seconds }),
  reset: () =>
    set({
      activeAlert: null,
      realtimeState: null,
      workflowStep: 1,
      alertType: null,
      holdTimer: null,
      alertStartTime: null,
      monitoringTimeRemaining: 1800,
    }),
}))
