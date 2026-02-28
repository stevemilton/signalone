'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { ref, update, set as rtdbSet } from 'firebase/database'
import { rtdb } from '@/lib/firebase/config'
import { useControlRoomStore } from '@/stores/control-room-store'
import { useAuthStore } from '@/stores/auth-store'
import { EscalationOverlay } from '@/components/control-room/EscalationOverlay'
import type { Alert, AlertGroup, Escalation } from '@/types'

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function GroupedAlertsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    alerts,
    setAlerts,
    groups,
    setGroups,
    monitoringTimer,
    setMonitoringTimer,
    addLogEntry,
    incidentLog,
  } = useControlRoomStore()

  const [group, setGroup] = useState<AlertGroup | null>(null)
  const [groupAlerts, setGroupAlerts] = useState<Alert[]>([])
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null)
  const [showEscalation, setShowEscalation] = useState(false)
  const [closing, setClosing] = useState(false)

  // Find group and its alerts from store
  useEffect(() => {
    const foundGroup = groups.find((g) => g.id === groupId)
    if (foundGroup) {
      setGroup(foundGroup)
      const foundAlerts = alerts.filter((a) => a.groupId === groupId)
      setGroupAlerts(foundAlerts)
    }
  }, [groupId, groups, alerts])

  // Monitoring timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setMonitoringTimer(Math.max(0, monitoringTimer - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [monitoringTimer, setMonitoringTimer])

  const handleEscalateAll = useCallback(
    async (escalation: Escalation) => {
      const now = Date.now()

      const updatedAlerts = groupAlerts.map((alert) => ({
        ...alert,
        escalations: [...alert.escalations, escalation],
        incidentLog: [
          ...alert.incidentLog,
          {
            timestamp: now,
            message: `Group escalation: ${escalation.service} notified`,
            actor: 'operator' as const,
          },
        ],
      }))

      setGroupAlerts(updatedAlerts)
      setAlerts(alerts.map((a) => {
        const updated = updatedAlerts.find((u) => u.id === a.id)
        return updated || a
      }))

      addLogEntry(`All alerts escalated to ${escalation.service}`, 'operator')

      // Update RTDB for each alert
      for (const alert of updatedAlerts) {
        try {
          await update(ref(rtdb, `activeAlerts/${alert.id}`), {
            updatedAt: now,
          })
        } catch (err) {
          console.error('RTDB update error:', err)
        }
      }
    },
    [groupAlerts, alerts, setAlerts, addLogEntry]
  )

  const handleExtendAll = useCallback(() => {
    setMonitoringTimer(monitoringTimer + 1800)
    addLogEntry('Group monitoring extended by 30 minutes for all members', 'operator')

    const now = Date.now()
    const updatedAlerts = groupAlerts.map((alert) => ({
      ...alert,
      incidentLog: [
        ...alert.incidentLog,
        {
          timestamp: now,
          message: 'Group monitoring extended by 30 minutes',
          actor: 'operator' as const,
        },
      ],
    }))

    setGroupAlerts(updatedAlerts)
    setAlerts(alerts.map((a) => {
      const updated = updatedAlerts.find((u) => u.id === a.id)
      return updated || a
    }))
  }, [monitoringTimer, setMonitoringTimer, addLogEntry, groupAlerts, alerts, setAlerts])

  const handleCloseGroup = useCallback(async () => {
    if (!user || !group) return
    setClosing(true)

    try {
      const now = Date.now()

      // Close all alerts in the group
      const updatedAlerts = groupAlerts.map((alert) => ({
        ...alert,
        status: 'closed' as const,
        closedAt: now,
        duration: Math.floor((now - alert.createdAt) / 1000),
        incidentLog: [
          ...alert.incidentLog,
          {
            timestamp: now,
            message: `Group closed by ${user.fullName}`,
            actor: 'operator' as const,
          },
        ],
      }))

      setGroupAlerts(updatedAlerts)
      setAlerts(alerts.map((a) => {
        const updated = updatedAlerts.find((u) => u.id === a.id)
        return updated || a
      }))

      // Update group status
      const updatedGroup: AlertGroup = {
        ...group,
        status: 'closed',
      }
      setGroup(updatedGroup)
      setGroups(groups.map((g) => (g.id === groupId ? updatedGroup : g)))

      addLogEntry(`Group closed by ${user.fullName}`, 'operator')

      // Clear RTDB for each alert
      for (const alert of groupAlerts) {
        try {
          await rtdbSet(ref(rtdb, `activeAlerts/${alert.id}`), null)
        } catch (err) {
          console.error('RTDB clear error:', err)
        }
      }

      // Navigate to first alert's feedback page
      if (groupAlerts.length > 0) {
        router.push(`/alert/${groupAlerts[0].id}/feedback`)
      } else {
        router.push('/control-room/dashboard')
      }
    } catch (error) {
      console.error('Close group error:', error)
      setClosing(false)
    }
  }, [user, group, groupAlerts, alerts, groups, groupId, setAlerts, setGroups, addLogEntry, router])

  if (!group || groupAlerts.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center py-20">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading group...</p>
        </div>
      </div>
    )
  }

  const redCount = groupAlerts.filter((a) => a.alertType === 'red').length
  const blueCount = groupAlerts.filter((a) => a.alertType === 'blue').length
  const allEscalations = groupAlerts.flatMap((a) => a.escalations)
  const uniqueEscalations = Array.from(
    new Map(allEscalations.map((e) => [e.service, e])).values()
  )

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/control-room/dashboard')}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-200">
              {groupAlerts.length} Users — Same Location (within 30m)
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[13px] text-slate-400">{group.locationName}</p>
              <p className="text-[13px] text-blue-400">///{ group.what3words}</p>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-lg">⏱</span>
          <span className="text-3xl font-extrabold text-slate-200">{formatTimer(monitoringTimer)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Cards */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Group Members
            </p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-semibold">
              {redCount} RED
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold">
              {blueCount} BLUE
            </span>
          </div>

          <div className="space-y-3">
            {groupAlerts.map((alert) => {
              const isRed = alert.alertType === 'red'
              const isExpanded = expandedAlertId === alert.id
              const alertTime = new Date(alert.createdAt).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })

              return (
                <div
                  key={alert.id}
                  onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                  className={`rounded-xl border cursor-pointer transition-all duration-200 ${
                    isExpanded ? 'border-slate-500' : 'border-slate-700 hover:scale-[1.03]'
                  }`}
                  style={{ backgroundColor: '#1e293b' }}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* User Photo */}
                      {isRed && alert.userPhoto ? (
                        <img
                          src={alert.userPhoto}
                          alt="User"
                          className="w-[90px] h-[90px] rounded-full object-cover border-2 border-slate-600 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-[90px] h-[90px] rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 border-2 border-slate-600">
                          <span className="text-2xl text-slate-400">
                            {isRed ? '👤' : '🔵'}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[13px] font-semibold text-slate-200 truncate">
                            {isRed ? alert.userName : `Anonymous ID: ${alert.userId.substring(0, 8)}`}
                          </p>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isRed
                                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                            }`}
                          >
                            {isRed ? 'RED' : 'BLUE'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div>
                            <span className="text-[10px] text-slate-500">Time: </span>
                            <span className="text-[13px] text-slate-300">{alertTime}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Risk: </span>
                            <span className="text-[13px] text-slate-300">{alert.riskPostcode}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">W3W: </span>
                            <span className="text-[13px] text-blue-400">
                              ///{alert.what3words}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500">Location: </span>
                            <span className="text-[13px] text-slate-300">{alert.locationName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: '#334155' }}>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {isRed && (
                          <>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Age</p>
                              <p className="text-[13px] text-slate-200">{alert.userAge || '--'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Name</p>
                              <p className="text-[13px] text-slate-200">{alert.userName}</p>
                            </div>
                          </>
                        )}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Status</p>
                          <p className="text-[13px] text-slate-200 capitalize">{alert.status.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Control Room</p>
                          <p className="text-[13px] text-slate-200">{alert.controlRoomId}</p>
                        </div>
                      </div>

                      {/* Individual alert actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/alert/${alert.id}`)
                        }}
                        className="text-[13px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        View Individual Alert →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Group Actions */}
          <div className="mt-6">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3">
              Group Actions
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShowEscalation(true)}
                className="px-4 py-3.5 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-500/20"
              >
                Escalate All
              </button>

              <button
                onClick={handleExtendAll}
                className="px-4 py-3.5 text-sm font-semibold text-slate-200 rounded-xl border hover:border-slate-400 transition-colors"
                style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              >
                Extend All 30min
              </button>

              <button
                onClick={handleCloseGroup}
                disabled={closing}
                className="px-4 py-3.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                {closing && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {closing ? 'Closing...' : 'Close Group'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Group Incident Log */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-5 border sticky top-6"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
              Group Incident Log
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {/* Combined log from all alerts in group, sorted by timestamp */}
              {(() => {
                const combinedLog = groupAlerts
                  .flatMap((a) =>
                    a.incidentLog.map((entry) => ({
                      ...entry,
                      alertId: a.id,
                      alertType: a.alertType,
                    }))
                  )
                  .sort((a, b) => a.timestamp - b.timestamp)

                // Also include store incident log entries
                const storeEntries = incidentLog.map((entry) => ({
                  ...entry,
                  alertId: 'group',
                  alertType: 'blue' as const,
                }))

                const allEntries = [...combinedLog, ...storeEntries]
                  .sort((a, b) => a.timestamp - b.timestamp)

                // Deduplicate by message+timestamp
                const seen = new Set<string>()
                const deduped = allEntries.filter((entry) => {
                  const key = `${entry.message}-${entry.timestamp}`
                  if (seen.has(key)) return false
                  seen.add(key)
                  return true
                })

                return deduped.map((entry, idx) => (
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
              })()}
            </div>

            {/* Escalation summary */}
            {uniqueEscalations.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#334155' }}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Escalations
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueEscalations.map((esc, idx) => (
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
          alertId={groupAlerts[0]?.id || groupId}
          onClose={() => setShowEscalation(false)}
          existingEscalations={uniqueEscalations}
          onEscalate={handleEscalateAll}
        />
      )}
    </div>
  )
}
