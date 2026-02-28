import { create } from 'zustand'
import type { Alert, DashboardStats, AlertGroup } from '@/types'

interface ControlRoomState {
  alerts: Alert[]
  activeAlert: Alert | null
  groups: AlertGroup[]
  stats: DashboardStats
  monitoringTimer: number
  incidentLog: { timestamp: number; message: string; actor: string }[]
  setAlerts: (alerts: Alert[]) => void
  setActiveAlert: (alert: Alert | null) => void
  setGroups: (groups: AlertGroup[]) => void
  setStats: (stats: DashboardStats) => void
  setMonitoringTimer: (seconds: number) => void
  addLogEntry: (message: string, actor: string) => void
  clearLog: () => void
  reset: () => void
}

const defaultStats: DashboardStats = {
  blueAlertsToday: { raised: 0, accepted: 0 },
  redAlertsToday: { raised: 0, accepted: 0 },
  linkedUsers: 0,
  systemStatus: 'online',
}

export const useControlRoomStore = create<ControlRoomState>((set) => ({
  alerts: [],
  activeAlert: null,
  groups: [],
  stats: defaultStats,
  monitoringTimer: 1800,
  incidentLog: [],
  setAlerts: (alerts) => set({ alerts }),
  setActiveAlert: (alert) => set({ activeAlert: alert }),
  setGroups: (groups) => set({ groups }),
  setStats: (stats) => set({ stats }),
  setMonitoringTimer: (seconds) => set({ monitoringTimer: seconds }),
  addLogEntry: (message, actor) =>
    set((state) => ({
      incidentLog: [...state.incidentLog, { timestamp: Date.now(), message, actor }],
    })),
  clearLog: () => set({ incidentLog: [] }),
  reset: () =>
    set({
      alerts: [],
      activeAlert: null,
      groups: [],
      stats: defaultStats,
      monitoringTimer: 1800,
      incidentLog: [],
    }),
}))
