'use client'

import { useEffect, useState, useRef, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { ref, onValue, off, update, set as rtdbSet } from 'firebase/database'
import { rtdb } from '@/lib/firebase/config'
import { useControlRoomStore } from '@/stores/control-room-store'
import { useAuthStore } from '@/stores/auth-store'
import { EscalationOverlay } from '@/components/control-room/EscalationOverlay'
import type { Alert, Escalation, RealtimeAlertState } from '@/types'

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function MonitoringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: alertId } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    alerts,
    setAlerts,
    monitoringTimer,
    setMonitoringTimer,
    addLogEntry,
    incidentLog,
  } = useControlRoomStore()

  const [alert, setAlert] = useState<Alert | null>(null)
  const [showEscalation, setShowEscalation] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [passengerFeelsSafe, setPassengerFeelsSafe] = useState(false)
  const [ending, setEnding] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Find alert from store
  useEffect(() => {
    const found = alerts.find((a) => a.id === alertId)
    if (found) {
      setAlert(found)
    }
  }, [alertId, alerts])

  // Start the countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setMonitoringTimer(Math.max(0, monitoringTimer - 1))
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [monitoringTimer, setMonitoringTimer])

  // Listen to RTDB for real-time updates (additional info + passenger feels safe)
  useEffect(() => {
    const alertRef = ref(rtdb, `activeAlerts/${alertId}`)
    const unsubscribe = onValue(alertRef, (snapshot) => {
      const data = snapshot.val() as RealtimeAlertState | null
      if (data) {
        if (data.additionalInfo && data.additionalInfo !== additionalInfo) {
          setAdditionalInfo(data.additionalInfo)
        }
        if (data.passengerFeelsSafe && !passengerFeelsSafe) {
          setPassengerFeelsSafe(true)
          addLogEntry('User confirmed they feel safe', 'user')
        }
      }
    })

    return () => off(alertRef)
  }, [alertId, additionalInfo, passengerFeelsSafe, addLogEntry])

  const handleExtend = useCallback(() => {
    setMonitoringTimer(monitoringTimer + 1800)
    addLogEntry('Monitoring extended by 30 minutes', 'operator')

    if (alert) {
      const now = Date.now()
      const updatedAlert: Alert = {
        ...alert,
        incidentLog: [
          ...alert.incidentLog,
          { timestamp: now, message: 'Monitoring extended by 30 minutes', actor: 'operator' },
        ],
      }
      setAlert(updatedAlert)
      setAlerts(alerts.map((a) => (a.id === alertId ? updatedAlert : a)))
    }
  }, [monitoringTimer, setMonitoringTimer, addLogEntry, alert, alerts, alertId, setAlerts])

  const handleEndMonitoring = useCallback(async () => {
    if (!alert || !user) return
    setEnding(true)

    try {
      // Clear RTDB
      await rtdbSet(ref(rtdb, `activeAlerts/${alertId}`), null)

      // Update store
      const now = Date.now()
      const updatedAlert: Alert = {
        ...alert,
        status: 'closed',
        closedAt: now,
        duration: Math.floor((now - alert.createdAt) / 1000),
        incidentLog: [
          ...alert.incidentLog,
          { timestamp: now, message: 'Monitoring ended by operator', actor: 'operator' },
        ],
      }

      setAlert(updatedAlert)
      setAlerts(alerts.map((a) => (a.id === alertId ? updatedAlert : a)))
      addLogEntry('Monitoring ended by operator', 'operator')

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      router.push(`/alert/${alertId}/feedback`)
    } catch (error) {
      console.error('End monitoring error:', error)
      setEnding(false)
    }
  }, [alert, user, alertId, alerts, setAlerts, addLogEntry, router])

  const handleEscalation = useCallback(
    (escalation: Escalation) => {
      if (!alert) return

      const updatedAlert: Alert = {
        ...alert,
        escalations: [...alert.escalations, escalation],
        incidentLog: [
          ...alert.incidentLog,
          {
            timestamp: escalation.timestamp,
            message: `Escalated to ${escalation.service}`,
            actor: 'operator',
          },
        ],
      }

      setAlert(updatedAlert)
      setAlerts(alerts.map((a) => (a.id === alertId ? updatedAlert : a)))
    },
    [alert, alerts, alertId, setAlerts]
  )

  if (!alert) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  const isRed = alert.alertType === 'red'
  const timerMinutes = Math.floor(monitoringTimer / 60)
  const timerWarning = monitoringTimer <= 300 // 5 minutes warning

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Timer Display */}
      <div className="text-center mb-8">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Active Monitoring
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">⏱</span>
          <span
            className={`text-6xl font-extrabold tracking-tight ${
              timerWarning ? 'text-red-400 animate-pulse-opacity' : 'text-slate-200'
            }`}
          >
            {formatTimer(monitoringTimer)}
          </span>
        </div>
        <p className="text-[13px] text-slate-500 mt-2">
          {monitoringTimer === 0
            ? 'Timer expired -- awaiting operator action'
            : `${timerMinutes} minute${timerMinutes !== 1 ? 's' : ''} remaining`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alert Summary */}
          <div
            className={`rounded-2xl p-4 border-2 ${
              isRed ? 'border-red-500/40' : 'border-blue-500/40'
            }`}
            style={{ backgroundColor: '#1e293b' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isRed ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                />
                <div>
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      isRed ? 'text-red-400' : 'text-blue-400'
                    }`}
                  >
                    {isRed ? 'RED' : 'BLUE'} Alert
                  </span>
                  <p className="text-[13px] text-slate-300 mt-0.5">
                    {alert.locationName} | {alert.riskPostcode}
                  </p>
                </div>
              </div>
              {alert.userName && (
                <p className="text-sm font-semibold text-slate-200">{alert.userName}</p>
              )}
            </div>
          </div>

          {/* User Status Indicator */}
          {passengerFeelsSafe && (
            <div className="rounded-xl p-4 border-2 border-green-500/40 bg-green-500/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <p className="text-[13px] font-semibold text-green-400">
                  User confirmed safe
                </p>
              </div>
            </div>
          )}

          {/* Live Additional Info Panel */}
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3">
              Live Additional Info
            </h2>
            {additionalInfo ? (
              <div className="rounded-xl p-4 bg-slate-900/50 border border-slate-700">
                <p className="text-[13px] text-slate-200 whitespace-pre-wrap">{additionalInfo}</p>
              </div>
            ) : (
              <div className="rounded-xl p-4 bg-slate-900/50 border border-slate-700/50">
                <p className="text-[13px] text-slate-500 italic">
                  Awaiting information... No additional information provided
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons (2-column grid) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowEscalation(true)}
              className="px-6 py-4 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-500/20"
            >
              Escalate
            </button>

            <button
              onClick={handleExtend}
              className="px-6 py-4 text-sm font-semibold text-slate-200 rounded-xl border hover:border-slate-400 transition-colors"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
            >
              Extend 30min
            </button>

            <button
              onClick={handleEndMonitoring}
              disabled={ending}
              className="col-span-2 px-6 py-4 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              {ending && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {ending ? 'Ending...' : 'Monitoring Ended'}
            </button>
          </div>
        </div>

        {/* Right Column: Incident Log */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-5 border sticky top-6"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
              Incident Log
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {incidentLog.length > 0 ? (
                incidentLog.map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          entry.actor === 'system'
                            ? 'bg-slate-500'
                            : entry.actor === 'operator'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-[13px] text-slate-300">{entry.message}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                alert.incidentLog.map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          entry.actor === 'system'
                            ? 'bg-slate-500'
                            : entry.actor === 'operator'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-[13px] text-slate-300">{entry.message}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Escalation summary */}
            {alert.escalations.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#334155' }}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Escalations
                </p>
                <div className="flex flex-wrap gap-2">
                  {alert.escalations.map((esc, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold capitalize"
                    >
                      {esc.service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Escalation Overlay */}
      {showEscalation && (
        <EscalationOverlay
          alertId={alertId}
          onClose={() => setShowEscalation(false)}
          existingEscalations={alert.escalations}
          onEscalate={handleEscalation}
        />
      )}
    </div>
  )
}
