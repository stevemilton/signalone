'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ref, onValue, off, update } from 'firebase/database'
import { rtdb } from '@/lib/firebase/config'
import { useControlRoomStore } from '@/stores/control-room-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Alert, RealtimeAlertState } from '@/types'

export default function AlertReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: alertId } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const { alerts, setAlerts, addLogEntry, clearLog } = useControlRoomStore()

  const [alert, setAlert] = useState<Alert | null>(null)
  const [realtimeState, setRealtimeState] = useState<RealtimeAlertState | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [markingUnavailable, setMarkingUnavailable] = useState(false)
  const [camerasInRange, setCamerasInRange] = useState(0)

  // Find alert from store
  useEffect(() => {
    const found = alerts.find((a) => a.id === alertId)
    if (found) {
      setAlert(found)
      // Estimate cameras in range (simulate based on location)
      setCamerasInRange(Math.floor(Math.random() * 6) + 2)
    }
  }, [alertId, alerts])

  // Initialize incident log
  useEffect(() => {
    if (alert) {
      clearLog()
      alert.incidentLog.forEach((entry) => {
        addLogEntry(entry.message, entry.actor)
      })
    }
  }, [alert?.id])

  // Listen to RTDB for real-time state
  useEffect(() => {
    const alertRef = ref(rtdb, `activeAlerts/${alertId}`)
    const unsubscribe = onValue(alertRef, (snapshot) => {
      const data = snapshot.val() as RealtimeAlertState | null
      if (data) {
        setRealtimeState(data)
      }
    })

    return () => off(alertRef)
  }, [alertId])

  const handleAcceptAlert = async () => {
    if (!alert || !user) return
    setAccepting(true)

    try {
      // Update RTDB
      await update(ref(rtdb, `activeAlerts/${alertId}`), {
        status: 'accepted',
        operatorStatus: 'operator_searching',
        updatedAt: Date.now(),
      })

      // Update store
      const updatedAlert: Alert = {
        ...alert,
        status: 'accepted',
        operatorId: user.id,
        operatorStatus: 'operator_searching',
        acceptedAt: Date.now(),
        incidentLog: [
          ...alert.incidentLog,
          {
            timestamp: Date.now(),
            message: `Alert accepted by ${user.fullName}`,
            actor: 'operator',
          },
        ],
      }

      setAlert(updatedAlert)
      setAlerts(alerts.map((a) => (a.id === alertId ? updatedAlert : a)))
      addLogEntry(`Alert accepted by ${user.fullName}`, 'operator')

      // Call API
      try {
        const idToken = await (await import('@/lib/firebase/config')).auth.currentUser?.getIdToken()
        if (idToken) {
          await fetch(`/api/alerts/${alertId}/accept`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          })
        }
      } catch (apiErr) {
        console.error('API accept error (continuing with local state):', apiErr)
      }

      router.push(`/alert/${alertId}/search`)
    } catch (error) {
      console.error('Accept alert error:', error)
      setAccepting(false)
    }
  }

  const handleTemporarilyUnavailable = async () => {
    if (!alert) return
    setMarkingUnavailable(true)

    try {
      await update(ref(rtdb, `activeAlerts/${alertId}`), {
        operatorStatus: 'temporarily_unavailable',
        updatedAt: Date.now(),
      })

      addLogEntry('Operator marked temporarily unavailable', 'operator')

      // Update store
      const updatedAlert: Alert = {
        ...alert,
        operatorStatus: 'temporarily_unavailable',
        incidentLog: [
          ...alert.incidentLog,
          {
            timestamp: Date.now(),
            message: 'Operator marked temporarily unavailable',
            actor: 'operator',
          },
        ],
      }

      setAlert(updatedAlert)
      setAlerts(alerts.map((a) => (a.id === alertId ? updatedAlert : a)))

      router.push('/control-room/dashboard')
    } catch (error) {
      console.error('Mark unavailable error:', error)
      setMarkingUnavailable(false)
    }
  }

  if (!alert) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading alert...</p>
        </div>
      </div>
    )
  }

  const isRed = alert.alertType === 'red'
  const alertTime = new Date(alert.createdAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Alert Banner */}
      <div
        className={`rounded-2xl p-5 mb-6 border-2 ${
          isRed
            ? 'border-red-500 animate-border-pulse-red'
            : 'border-blue-500'
        }`}
        style={{ backgroundColor: isRed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-4 h-4 rounded-full ${
              isRed ? 'bg-red-500 animate-pulse-opacity' : 'bg-blue-500'
            }`}
          />
          <h1 className="text-[22px] font-extrabold">
            {isRed ? (
              <span className="text-red-400">NEW RED ALERT — IMMEDIATE DANGER</span>
            ) : (
              <span className="text-blue-400">NEW BLUE ALERT</span>
            )}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Info + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Information Panel */}
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
              User Information
            </h2>

            <div className="flex gap-5">
              {/* User Photo (Red alerts only) */}
              {isRed && alert.userPhoto && (
                <div className="flex-shrink-0">
                  <img
                    src={alert.userPhoto}
                    alt="User photo"
                    className="w-[90px] h-[90px] rounded-full object-cover border-2 border-slate-600"
                  />
                </div>
              )}

              <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Name</p>
                  <p className="text-[13px] font-semibold text-slate-200">
                    {isRed ? alert.userName : `ID: ${alert.userId.substring(0, 8)}...`}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Age</p>
                  <p className="text-[13px] font-semibold text-slate-200">
                    {isRed ? alert.userAge : '-- (Blue alert)'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Alert Time</p>
                  <p className="text-[13px] font-semibold text-slate-200">{alertTime}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Risk Postcode</p>
                  <p className="text-[13px] font-semibold text-slate-200">{alert.riskPostcode}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Location</p>
                  <p className="text-[13px] font-semibold text-slate-200">{alert.locationName || '--'}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">What3Words</p>
                  <p className="text-[13px] font-semibold text-blue-400">
                    ///{alert.what3words || '--'}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Control Room</p>
                  <p className="text-[13px] font-semibold text-slate-200">{alert.controlRoomId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CCTV & SMS Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
            >
              <p className="text-[13px] text-slate-300">
                <span className="mr-2">📷</span>
                <span className="font-semibold">{camerasInRange} cameras</span> in range
              </p>
            </div>

            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
            >
              <p className="text-[13px] text-slate-300">
                <span className="mr-2">📱</span>
                SMS automatically sent to emergency contact on file
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAcceptAlert}
              disabled={accepting}
              className="flex-1 px-6 py-4 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {accepting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {accepting ? 'Accepting...' : 'Accept Alert'}
            </button>

            <button
              onClick={handleTemporarilyUnavailable}
              disabled={markingUnavailable}
              className="px-6 py-4 text-sm font-semibold text-slate-300 rounded-xl border hover:border-slate-400 transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
            >
              {markingUnavailable ? 'Updating...' : 'Temporarily Unavailable'}
            </button>
          </div>
        </div>

        {/* Right Column: Incident Log */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
              Incident Log
            </h2>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {alert.incidentLog.map((entry, idx) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
