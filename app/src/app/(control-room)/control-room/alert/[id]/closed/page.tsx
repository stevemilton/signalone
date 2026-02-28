'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useControlRoomStore } from '@/stores/control-room-store'
import type { Alert } from '@/types'

function generateReferenceNumber(): string {
  const prefix = 'INC'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

export default function ClosedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: alertId } = use(params)
  const router = useRouter()
  const { alerts, reset } = useControlRoomStore()

  const [alert, setAlert] = useState<Alert | null>(null)
  const [referenceNumber] = useState(() => generateReferenceNumber())

  // Find alert from store
  useEffect(() => {
    const found = alerts.find((a) => a.id === alertId)
    if (found) {
      setAlert(found)
    }
  }, [alertId, alerts])

  const handleReturnToDashboard = () => {
    // Reset monitoring timer for next alert
    reset()
    router.push('/control-room/dashboard')
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

  const isRed = alert.alertType === 'red'
  const duration = alert.duration || Math.floor((Date.now() - alert.createdAt) / 1000)

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      {/* Success Icon */}
      <div className="text-center mb-8 mt-8">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[22px] font-extrabold text-slate-200">Incident Closed</h1>
        <p className="text-[13px] text-slate-400 mt-2">
          The alert has been resolved and an incident record has been created.
        </p>
      </div>

      {/* Incident Reference */}
      <div
        className="rounded-2xl p-5 border text-center mb-6"
        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
      >
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
          Incident Reference Number
        </p>
        <p className="text-2xl font-extrabold text-slate-200 tracking-wider">{referenceNumber}</p>
      </div>

      {/* Summary of Actions */}
      <div
        className="rounded-2xl p-5 border mb-6"
        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
      >
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
          Summary
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-[13px] text-slate-400">Alert Type</span>
            <span
              className={`text-[13px] font-semibold ${
                isRed ? 'text-red-400' : 'text-blue-400'
              }`}
            >
              {isRed ? 'RED' : 'BLUE'} Alert
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[13px] text-slate-400">Classification</span>
            <span className="text-[13px] font-semibold text-slate-200 capitalize">
              {alert.classification?.replace('_', ' ') || 'Not classified'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[13px] text-slate-400">Location</span>
            <span className="text-[13px] font-semibold text-slate-200">
              {alert.locationName || alert.riskPostcode}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[13px] text-slate-400">Duration</span>
            <span className="text-[13px] font-semibold text-slate-200">
              {formatDuration(duration)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[13px] text-slate-400">Escalations</span>
            <span className="text-[13px] font-semibold text-slate-200">
              {alert.escalations.length > 0
                ? alert.escalations.map((e) => e.service).join(', ')
                : 'None'}
            </span>
          </div>

          {alert.operatorNotes && (
            <div className="pt-3 border-t" style={{ borderColor: '#334155' }}>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Operator Notes
              </span>
              <p className="text-[13px] text-slate-300 mt-1">{alert.operatorNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Return to Dock instruction */}
      <div
        className="rounded-2xl p-4 border mb-6 text-center"
        style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
      >
        <p className="text-[13px] text-slate-400">
          If using a dedicated terminal, please return device to dock.
        </p>
      </div>

      {/* Return to Dashboard Button */}
      <button
        onClick={handleReturnToDashboard}
        className="w-full px-6 py-4 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
      >
        Return to Dashboard
      </button>
    </div>
  )
}
