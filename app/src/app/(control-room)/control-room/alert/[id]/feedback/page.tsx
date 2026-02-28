'use client'

import { useState, use } from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useControlRoomStore } from '@/stores/control-room-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Alert, AlertClassification } from '@/types'

interface ClassificationOption {
  value: AlertClassification
  icon: string
  label: string
  description: string
}

const classificationOptions: ClassificationOption[] = [
  { value: 'genuine', icon: '✅', label: 'Genuine alert', description: 'Real concern' },
  { value: 'false_alert', icon: '⚠️', label: 'False alert', description: 'No concern identified' },
  { value: 'malicious', icon: '🚨', label: 'Malicious', description: 'Deliberate misuse' },
  { value: 'unclear', icon: '❓', label: 'Unclear', description: 'Unable to determine' },
]

export default function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: alertId } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const { alerts, setAlerts, incidentLog, addLogEntry } = useControlRoomStore()

  const [alert, setAlert] = useState<Alert | null>(null)
  const [classification, setClassification] = useState<AlertClassification | null>(null)
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Find alert from store
  useEffect(() => {
    const found = alerts.find((a) => a.id === alertId)
    if (found) {
      setAlert(found)
    }
  }, [alertId, alerts])

  const handleSubmit = async () => {
    setValidationError(null)

    if (!classification) {
      setValidationError('Please select an alert classification before submitting.')
      return
    }

    if (!alert || !user) return

    setSubmitting(true)

    try {
      const now = Date.now()

      // Call API to close the alert and create incident
      try {
        const idToken = await (await import('@/lib/firebase/config')).auth.currentUser?.getIdToken()
        if (idToken) {
          await fetch(`/api/alerts/${alertId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              status: 'closed',
              classification,
              operatorNotes: notes || null,
            }),
          })
        }
      } catch (apiErr) {
        console.error('API close error (continuing with local state):', apiErr)
      }

      // Update local store
      const updatedAlert: Alert = {
        ...alert,
        status: 'closed',
        classification,
        operatorNotes: notes || null,
        closedAt: now,
        duration: Math.floor((now - alert.createdAt) / 1000),
        incidentLog: [
          ...alert.incidentLog,
          {
            timestamp: now,
            message: `Alert classified as "${classification}" by ${user.fullName}`,
            actor: 'operator',
          },
          {
            timestamp: now,
            message: 'Incident closed. Record created.',
            actor: 'system',
          },
        ],
      }

      setAlert(updatedAlert)
      setAlerts(alerts.map((a) => (a.id === alertId ? updatedAlert : a)))
      addLogEntry(`Alert classified as "${classification}"`, 'operator')
      addLogEntry('Incident closed. Record created.', 'system')

      router.push(`/alert/${alertId}/closed`)
    } catch (error) {
      console.error('Submit feedback error:', error)
      setSubmitting(false)
    }
  }

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

  // Combine alert incidentLog and store incidentLog
  const allLogEntries = incidentLog.length > 0 ? incidentLog : alert.incidentLog

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-slate-200">Monitoring Ended</h1>
        <p className="text-[13px] text-slate-400 mt-1">
          Classify this incident and submit your notes to close the alert.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Classification + Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alert Classification */}
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
              Alert Classification <span className="text-red-400">*</span>
            </h2>

            {validationError && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10">
                <p className="text-sm text-red-400">{validationError}</p>
              </div>
            )}

            <div className="space-y-2">
              {classificationOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    classification === option.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}
                  style={classification !== option.value ? { backgroundColor: '#0f172a' } : undefined}
                >
                  <input
                    type="radio"
                    name="classification"
                    value={option.value}
                    checked={classification === option.value}
                    onChange={() => {
                      setClassification(option.value)
                      setValidationError(null)
                    }}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      classification === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-600'
                    }`}
                  >
                    {classification === option.value && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-xl">{option.icon}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-200">{option.label}</p>
                    <p className="text-[11px] text-slate-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3">
              Additional Notes
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional observations, actions taken, or notes for this incident..."
              className="w-full px-4 py-3 text-[13px] rounded-xl border bg-slate-900 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              style={{ borderColor: '#334155', minHeight: '120px' }}
              rows={5}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full px-6 py-4 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {submitting ? 'Submitting...' : 'Submit & Close'}
          </button>
        </div>

        {/* Right Column: Full Incident Log */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
              Full Incident Log
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {allLogEntries.map((entry, idx) => (
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

            {/* Escalation summary */}
            {alert.escalations.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#334155' }}>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Escalations Made
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
    </div>
  )
}
