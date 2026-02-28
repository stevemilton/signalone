'use client'

import { useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useControlRoomStore } from '@/stores/control-room-store'
import type { Escalation } from '@/types'

interface EscalationOverlayProps {
  alertId: string
  onClose: () => void
  existingEscalations: Escalation[]
  onEscalate: (escalation: Escalation) => void
}

type EscalationService = 'police' | 'ambulance' | 'fire' | 'supervisor'

interface EscalationButton {
  service: EscalationService
  icon: string
  label: string
  description: string
}

const escalationButtons: EscalationButton[] = [
  { service: 'police', icon: '🚔', label: 'Police', description: 'Report to local police' },
  { service: 'ambulance', icon: '🚑', label: 'Ambulance', description: 'Medical emergency' },
  { service: 'fire', icon: '🚒', label: 'Fire Brigade', description: 'Fire or hazard' },
  { service: 'supervisor', icon: '👤', label: 'Supervisor', description: 'Alert supervisor' },
]

export function EscalationOverlay({ alertId, onClose, existingEscalations, onEscalate }: EscalationOverlayProps) {
  const { user } = useAuthStore()
  const { addLogEntry } = useControlRoomStore()

  const [notifiedServices, setNotifiedServices] = useState<Set<EscalationService>>(
    new Set(existingEscalations.map((e) => e.service))
  )
  const [submitting, setSubmitting] = useState<EscalationService | null>(null)

  const handleEscalate = useCallback(
    async (service: EscalationService) => {
      if (notifiedServices.has(service) || !user) return

      setSubmitting(service)

      try {
        const escalation: Escalation = {
          service,
          timestamp: Date.now(),
          operatorId: user.id,
        }

        // Call API
        try {
          const idToken = await (await import('@/lib/firebase/config')).auth.currentUser?.getIdToken()
          if (idToken) {
            await fetch(`/api/alerts/${alertId}/escalate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ service }),
            })
          }
        } catch (apiErr) {
          console.error('API escalate error (continuing with local state):', apiErr)
        }

        setNotifiedServices((prev) => new Set([...prev, service]))
        addLogEntry(`Escalated to ${service}`, 'operator')
        onEscalate(escalation)
      } catch (error) {
        console.error('Escalation error:', error)
      } finally {
        setSubmitting(null)
      }
    },
    [alertId, user, notifiedServices, addLogEntry, onEscalate]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[500px] rounded-2xl p-6 border animate-slide-up"
        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold text-slate-200">Escalate Incident</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Escalation Buttons Grid: 3 columns + 1 */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {escalationButtons.slice(0, 3).map((btn) => {
            const isNotified = notifiedServices.has(btn.service)
            const isSubmitting = submitting === btn.service

            return (
              <button
                key={btn.service}
                onClick={() => handleEscalate(btn.service)}
                disabled={isNotified || isSubmitting}
                className={`rounded-xl p-4 border text-center transition-all ${
                  isNotified
                    ? 'bg-green-600/20 border-green-500/40'
                    : 'border-slate-600 hover:border-slate-400 hover:bg-slate-700/50'
                } ${isSubmitting ? 'opacity-70' : ''}`}
                style={!isNotified ? { backgroundColor: '#0f172a' } : undefined}
              >
                <div className="text-3xl mb-2">{isNotified ? '✓' : btn.icon}</div>
                <p className={`text-sm font-semibold ${isNotified ? 'text-green-400' : 'text-slate-200'}`}>
                  {isNotified ? 'Notified' : btn.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isNotified ? `${btn.label} notified` : btn.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Supervisor button (full width or single column) */}
        <div className="grid grid-cols-3 gap-3">
          {escalationButtons.slice(3).map((btn) => {
            const isNotified = notifiedServices.has(btn.service)
            const isSubmitting = submitting === btn.service

            return (
              <button
                key={btn.service}
                onClick={() => handleEscalate(btn.service)}
                disabled={isNotified || isSubmitting}
                className={`rounded-xl p-4 border text-center transition-all ${
                  isNotified
                    ? 'bg-green-600/20 border-green-500/40'
                    : 'border-slate-600 hover:border-slate-400 hover:bg-slate-700/50'
                } ${isSubmitting ? 'opacity-70' : ''}`}
                style={!isNotified ? { backgroundColor: '#0f172a' } : undefined}
              >
                <div className="text-3xl mb-2">{isNotified ? '✓' : btn.icon}</div>
                <p className={`text-sm font-semibold ${isNotified ? 'text-green-400' : 'text-slate-200'}`}>
                  {isNotified ? 'Notified' : btn.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isNotified ? `${btn.label} notified` : btn.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 text-sm font-semibold text-slate-400 rounded-xl border hover:border-slate-400 hover:text-slate-200 transition-colors"
          style={{ borderColor: '#334155' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
