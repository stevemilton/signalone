'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ref, onValue, off, set as rtdbSet, push as rtdbPush } from 'firebase/database'
import { rtdb } from '@/lib/firebase/config'
import { useControlRoomStore } from '@/stores/control-room-store'
import { useAuthStore } from '@/stores/auth-store'
import RiskScoreBadge from '@/components/control-room/RiskScoreBadge'
import type { RiskLevel } from '@/types/risk'
import type { Alert, AlertType, DashboardStats, AlertGroup, GeoLocation } from '@/types'

// --- Audio alert utility ---
function playAlertTone(type: AlertType) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    if (type === 'red') {
      oscillator.frequency.value = 880
      oscillator.type = 'square'
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.8)

      // Second beep
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.frequency.value = 1100
      osc2.type = 'square'
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.3)
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
      osc2.start(ctx.currentTime + 0.3)
      osc2.stop(ctx.currentTime + 0.8)
    } else {
      oscillator.frequency.value = 660
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.6)
    }
  } catch (e) {
    console.warn('Audio alert failed:', e)
  }
}

function sendBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined') return

  if (Notification.permission === 'granted' && document.hidden) {
    new Notification(title, { body, icon: '/favicon.ico' })
  } else if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// --- Mock data generators ---
function generateMockLocation(): GeoLocation {
  return {
    lat: 51.5074 + (Math.random() - 0.5) * 0.02,
    lng: -0.1278 + (Math.random() - 0.5) * 0.02,
    accuracy: 10 + Math.random() * 20,
    timestamp: Date.now(),
  }
}

const firstNames = ['James', 'Sarah', 'Mohammed', 'Emily', 'David', 'Priya', 'Oliver', 'Amara']
const lastNames = ['Smith', 'Jones', 'Patel', 'Williams', 'Brown', 'Taylor', 'Ahmed', 'Wilson']
const locations = [
  'Piccadilly Circus, London',
  'Victoria Station, London',
  'Camden Town, London',
  'Shoreditch High Street, London',
  'Kings Cross, London',
  'Waterloo Bridge, London',
]
const postcodes = ['W1J 9HP', 'SW1V 1JU', 'NW1 8QL', 'E1 6JE', 'N1C 4QP', 'SE1 8XZ']
const w3wAddresses = [
  'filled.count.soap',
  'index.home.raft',
  'daring.lion.race',
  'limit.pond.oven',
  'stump.spill.held',
  'tiger.flute.beds',
]

function generateMockAlert(type: AlertType): Alert {
  const now = Date.now()
  const idx = Math.floor(Math.random() * locations.length)
  const isRed = type === 'red'
  const id = `sim_${now}_${Math.random().toString(36).substring(2, 8)}`

  return {
    id,
    alertType: type,
    userId: `user_${Math.random().toString(36).substring(2, 10)}`,
    operatorId: null,
    controlRoomId: 'cr_london_central',
    status: 'awaiting_review',
    operatorStatus: null,
    location: generateMockLocation(),
    locationName: locations[idx],
    riskPostcode: postcodes[idx],
    what3words: w3wAddresses[idx],
    additionalInfo: '',
    passengerFeelsSafe: true,
    userName: isRed ? `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}` : null,
    userAge: isRed ? `${18 + Math.floor(Math.random() * 50)}` : null,
    userPhoto: isRed ? `https://api.dicebear.com/7.x/personas/svg?seed=${id}` : null,
    createdAt: now,
    acceptedAt: null,
    locatedAt: null,
    closedAt: null,
    classification: null,
    operatorNotes: null,
    escalations: [],
    incidentLog: [
      { timestamp: now, message: `${isRed ? 'Red' : 'Blue'} alert created`, actor: 'system' },
    ],
    groupId: null,
    duration: null,
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { alerts, setAlerts, stats, setStats, groups, setGroups } = useControlRoomStore()
  const prevAlertCountRef = useRef(0)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Track user interaction for audio context
  useEffect(() => {
    const markInteracted = () => setHasInteracted(true)
    window.addEventListener('click', markInteracted, { once: true })
    window.addEventListener('keydown', markInteracted, { once: true })
    return () => {
      window.removeEventListener('click', markInteracted)
      window.removeEventListener('keydown', markInteracted)
    }
  }, [])

  // Listen to RTDB for new alerts
  useEffect(() => {
    const controlRoomId = user?.controlRoomId || 'cr_london_central'
    const alertsRef = ref(rtdb, 'activeAlerts')

    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        // No new active alerts from RTDB, but keep store alerts
        return
      }

      // Check for new alerts that were not in the store
      const rtdbAlertIds = Object.keys(data)
      const existingIds = new Set(alerts.map((a) => a.id))

      let newAlertType: AlertType | null = null
      for (const alertId of rtdbAlertIds) {
        if (!existingIds.has(alertId)) {
          newAlertType = data[alertId].alertType || 'blue'
          break
        }
      }

      // Play sound and notify if new alert arrived
      if (newAlertType && hasInteracted && rtdbAlertIds.length > prevAlertCountRef.current) {
        playAlertTone(newAlertType)
        sendBrowserNotification(
          newAlertType === 'red' ? 'RED ALERT' : 'Blue Alert',
          `New ${newAlertType} alert received.`
        )
      }

      prevAlertCountRef.current = rtdbAlertIds.length
    })

    return () => off(alertsRef)
  }, [user?.controlRoomId, alerts, hasInteracted])

  // Update stats based on current alerts
  useEffect(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    const todayAlerts = alerts.filter((a) => a.createdAt >= todayStart)

    const blueAlerts = todayAlerts.filter((a) => a.alertType === 'blue')
    const redAlerts = todayAlerts.filter((a) => a.alertType === 'red')

    const updatedStats: DashboardStats = {
      blueAlertsToday: {
        raised: blueAlerts.length,
        accepted: blueAlerts.filter((a) => ['accepted', 'searching', 'monitoring', 'closed'].includes(a.status)).length,
      },
      redAlertsToday: {
        raised: redAlerts.length,
        accepted: redAlerts.filter((a) => ['accepted', 'searching', 'monitoring', 'closed'].includes(a.status)).length,
      },
      linkedUsers: stats.linkedUsers || 142,
      systemStatus: 'online',
    }

    setStats(updatedStats)
  }, [alerts, setStats, stats.linkedUsers])

  // --- Simulation handlers ---
  const simulateAlert = useCallback(
    (type: AlertType) => {
      const mockAlert = generateMockAlert(type)

      // Add to store
      setAlerts([mockAlert, ...alerts])

      // Write to RTDB
      const alertRef = ref(rtdb, `activeAlerts/${mockAlert.id}`)
      rtdbSet(alertRef, {
        alertType: mockAlert.alertType,
        status: mockAlert.status,
        operatorStatus: null,
        additionalInfo: '',
        passengerFeelsSafe: true,
        location: mockAlert.location,
        updatedAt: Date.now(),
      }).catch((err) => console.error('RTDB write error:', err))

      playAlertTone(type)
    },
    [alerts, setAlerts]
  )

  const simulateGroupedAlerts = useCallback(() => {
    const baseLocation = generateMockLocation()
    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const types: AlertType[] = ['blue', 'red', 'blue', 'blue', 'red']

    const groupAlerts = types.map((type) => {
      const alert = generateMockAlert(type)
      // Cluster locations within 30m
      alert.location = {
        ...baseLocation,
        lat: baseLocation.lat + (Math.random() - 0.5) * 0.0003,
        lng: baseLocation.lng + (Math.random() - 0.5) * 0.0003,
      }
      alert.groupId = groupId
      return alert
    })

    // Create group
    const newGroup: AlertGroup = {
      id: groupId,
      alertIds: groupAlerts.map((a) => a.id),
      location: baseLocation,
      locationName: groupAlerts[0].locationName,
      what3words: groupAlerts[0].what3words,
      createdAt: Date.now(),
      status: 'active',
    }

    setAlerts([...groupAlerts, ...alerts])
    setGroups([newGroup, ...groups])

    // Write each to RTDB
    groupAlerts.forEach((mockAlert) => {
      const alertRef = ref(rtdb, `activeAlerts/${mockAlert.id}`)
      rtdbSet(alertRef, {
        alertType: mockAlert.alertType,
        status: mockAlert.status,
        operatorStatus: null,
        additionalInfo: '',
        passengerFeelsSafe: true,
        location: mockAlert.location,
        updatedAt: Date.now(),
      }).catch((err) => console.error('RTDB write error:', err))
    })

    playAlertTone('red')
  }, [alerts, groups, setAlerts, setGroups])

  // Determine system idle/active
  const activeAlerts = alerts.filter(
    (a) => !['closed', 'cancelled', 'expired'].includes(a.status)
  )
  const hasActiveAlerts = activeAlerts.length > 0

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-slate-200">Dashboard</h1>
        <p className="text-[13px] text-slate-400 mt-1">
          Real-time overview of alert activity
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Blue Alerts Today */}
        <div
          className="rounded-2xl p-5 border-2 border-blue-500/40"
          style={{ backgroundColor: '#1e293b' }}
        >
          <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-3 opacity-80">
            Blue Alerts Today
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-blue-400">
              {stats.blueAlertsToday.raised}
            </span>
            <span className="text-[13px] text-slate-400">raised</span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-semibold text-slate-300">
              {stats.blueAlertsToday.accepted}
            </span>
            <span className="text-[13px] text-slate-500 ml-1">accepted</span>
          </div>
        </div>

        {/* Red Alerts Today */}
        <div
          className="rounded-2xl p-5 border-2 border-red-500/40"
          style={{ backgroundColor: '#1e293b' }}
        >
          <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-3 opacity-80">
            Red Alerts Today
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-red-400">
              {stats.redAlertsToday.raised}
            </span>
            <span className="text-[13px] text-slate-400">raised</span>
          </div>
          <div className="mt-1">
            <span className="text-sm font-semibold text-slate-300">
              {stats.redAlertsToday.accepted}
            </span>
            <span className="text-[13px] text-slate-500 ml-1">accepted</span>
          </div>
        </div>

        {/* Linked Users */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
        >
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 opacity-80">
            Linked Users
          </p>
          <span className="text-3xl font-extrabold text-slate-200">
            {stats.linkedUsers}
          </span>
          <p className="text-[13px] text-slate-500 mt-1">registered</p>
        </div>

        {/* System Status */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
        >
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 opacity-80">
            System Status
          </p>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                stats.systemStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-lg font-extrabold text-slate-200 capitalize">
              {stats.systemStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-6 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-[13px] text-slate-300 font-medium">System Online</span>
        </div>

        {hasActiveAlerts ? (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-opacity" />
            <span className="text-[13px] text-green-400 font-medium">Monitoring Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-blink" />
            <span className="text-[13px] text-amber-400 font-medium">System Idle</span>
          </div>
        )}
      </div>

      {/* Active Alerts List */}
      {activeAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-4">
            Active Alerts ({activeAlerts.length})
          </h2>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => {
                  if (alert.groupId) {
                    router.push(`/group/${alert.groupId}`)
                  } else {
                    router.push(`/alert/${alert.id}`)
                  }
                }}
                className="rounded-xl p-4 border cursor-pointer hover:border-slate-500 transition-colors"
                style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        alert.alertType === 'red'
                          ? 'bg-red-500 animate-pulse-opacity'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-extrabold uppercase tracking-wider ${
                            alert.alertType === 'red' ? 'text-red-400' : 'text-blue-400'
                          }`}
                        >
                          {alert.alertType === 'red' ? 'RED' : 'BLUE'} Alert
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded-full border"
                          style={{ borderColor: '#334155' }}
                        >
                          {alert.status.replace('_', ' ')}
                        </span>
                        {alert.groupId && (
                          <span className="text-[10px] uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10">
                            Grouped
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-slate-300 mt-0.5">
                        {alert.locationName || alert.riskPostcode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {alert.riskScore != null && alert.riskLevel && (
                      <RiskScoreBadge
                        score={alert.riskScore}
                        level={alert.riskLevel as RiskLevel}
                        size="sm"
                      />
                    )}
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-slate-300">
                        {new Date(alert.createdAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </p>
                      {alert.userName && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {alert.userName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped Alerts */}
      {groups.filter((g) => g.status === 'active').length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-4">
            Grouped Alerts
          </h2>
          <div className="space-y-3">
            {groups
              .filter((g) => g.status === 'active')
              .map((group) => {
                const groupAlerts = alerts.filter((a) => a.groupId === group.id)
                return (
                  <div
                    key={group.id}
                    onClick={() => router.push(`/group/${group.id}`)}
                    className="rounded-xl p-4 border-2 border-amber-500/30 cursor-pointer hover:border-amber-500/50 transition-colors"
                    style={{ backgroundColor: '#1e293b' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                          {groupAlerts.length} Users -- Same Location
                        </span>
                        <p className="text-[13px] text-slate-300 mt-0.5">
                          {group.locationName}
                        </p>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-300">
                        {new Date(group.createdAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Simulation Buttons */}
      <div className="mt-8 border-t pt-6" style={{ borderColor: '#334155' }}>
        <h2 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-1">
          Simulation
        </h2>
        <p className="text-[13px] text-slate-500 mb-4">
          Generate mock alerts for testing and demonstration purposes.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => simulateAlert('blue')}
            className="px-5 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            Simulate Blue Alert
          </button>
          <button
            onClick={() => simulateAlert('red')}
            className="px-5 py-3 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
          >
            Simulate Red Alert
          </button>
          <button
            onClick={simulateGroupedAlerts}
            className="px-5 py-3 text-sm font-semibold text-slate-200 rounded-xl border hover:border-slate-400 transition-colors"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            Simulate Grouped Alerts
          </button>
        </div>
      </div>
    </div>
  )
}
