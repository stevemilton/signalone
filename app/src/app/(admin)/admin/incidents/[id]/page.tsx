'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import type { Incident, AlertClassification, IncidentLogEntry, Escalation } from '@/types'

interface IncidentDetail extends Incident {
  userName: string
  userEmail: string
  operatorName: string
  controlRoomName: string
  what3words: string
  reviewNotes: string | null
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

const classificationOptions: { value: AlertClassification; label: string }[] = [
  { value: 'genuine', label: 'Genuine' },
  { value: 'false_alert', label: 'False Alert' },
  { value: 'malicious', label: 'Malicious' },
  { value: 'unclear', label: 'Unclear' },
]

const classificationColors: Record<string, string> = {
  genuine: 'bg-green-100 text-green-700 border-green-200',
  false_alert: 'bg-amber-100 text-amber-700 border-amber-200',
  malicious: 'bg-red-100 text-red-700 border-red-200',
  unclear: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const incidentId = params.id as string

  const [incident, setIncident] = useState<IncidentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Editable fields
  const [classification, setClassification] = useState<AlertClassification | ''>('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const fetchIncident = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}`)
      if (!res.ok) throw new Error('Failed to load incident')
      const data = await res.json()
      setIncident(data.incident)
      setClassification(data.incident.classification || '')
      setReviewNotes(data.incident.reviewNotes || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [incidentId])

  useEffect(() => {
    fetchIncident()
  }, [fetchIncident])

  const handleSaveReview = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classification: classification || null,
          reviewNotes,
          markAsReviewed: true,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save review')
      }
      setSuccess('Review saved successfully')
      fetchIncident()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true)
    try {
      const res = await fetch(`/api/admin/incidents/${incidentId}/report`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate report')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incident-${incident?.referenceNumber || incidentId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setGeneratingPdf(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Loading incident...</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.push('/admin/incidents')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Incidents
        </button>
        <Card variant="danger">
          <p className="text-red-700 text-sm">{error || 'Incident not found'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/incidents')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Incident</h1>
              <span className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{incident.referenceNumber}</span>
            </div>
            <p className="text-sm text-gray-500">{formatDateTime(incident.createdAt)}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleGeneratePdf} loading={generatingPdf}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Generate PDF Report
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Details */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase ${incident.alertType === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                <span className={`w-2 h-2 rounded-full ${incident.alertType === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                {incident.alertType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">User</span>
              <button
                onClick={() => router.push(`/admin/users/${incident.userId}`)}
                className="text-blue-600 hover:underline font-medium"
              >
                {incident.userName || incident.userId.slice(0, 12)}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-800">{incident.userEmail || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Operator</span>
              <span className="text-gray-800 font-medium">{incident.operatorName || incident.operatorId.slice(0, 12)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Control Room</span>
              <span className="text-gray-800">{incident.controlRoomName}</span>
            </div>
            <div className="border-t border-gray-100 pt-3" />
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span className="text-gray-800 text-right max-w-[60%]">{incident.locationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">what3words</span>
              <span className="text-xs font-mono text-blue-600">{incident.what3words || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Coordinates</span>
              <span className="text-xs font-mono text-gray-600">{incident.location.lat.toFixed(6)}, {incident.location.lng.toFixed(6)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3" />
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="text-gray-800 font-medium">{formatDuration(incident.duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Opened</span>
              <span className="text-gray-600 text-xs">{formatDateTime(incident.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Closed</span>
              <span className="text-gray-600 text-xs">{formatDateTime(incident.closedAt)}</span>
            </div>
          </div>
        </Card>

        {/* Classification and Operator Notes */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Classification</h2>
          <div className="space-y-4">
            {incident.classification && (
              <div className={`px-4 py-3 rounded-xl border text-sm font-medium ${classificationColors[incident.classification]}`}>
                Current: {incident.classification.replace('_', ' ')}
              </div>
            )}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Update Classification</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as AlertClassification)}
                className="w-full px-3.5 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">Select classification...</option>
                {classificationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {incident.operatorNotes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Operator Notes</h3>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {incident.operatorNotes}
                </div>
              </div>
            )}

            {/* Escalations */}
            {incident.escalations && incident.escalations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Escalations</h3>
                <div className="space-y-2">
                  {incident.escalations.map((esc: Escalation, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium text-red-700 capitalize">{esc.service}</span>
                      <span className="text-xs text-red-500">{formatDateTime(esc.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Review Section */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Review</h2>
          <div className="space-y-4">
            {incident.reviewedAt && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <p className="text-sm text-green-700 font-medium">Reviewed</p>
                <p className="text-xs text-green-600 mt-0.5">
                  by {incident.reviewedBy || 'Unknown'} on {formatDateTime(incident.reviewedAt)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Review Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={5}
                placeholder="Add review notes, observations, or follow-up actions..."
                className="w-full px-3.5 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleSaveReview}
              loading={saving}
            >
              Save Review &amp; Mark as Reviewed
            </Button>
          </div>
        </Card>
      </div>

      {/* Incident Timeline */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Incident Timeline</h2>
        {(!incident.incidentLog || incident.incidentLog.length === 0) ? (
          <p className="text-sm text-gray-400 py-4 text-center">No timeline entries</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {incident.incidentLog
                .sort((a: IncidentLogEntry, b: IncidentLogEntry) => a.timestamp - b.timestamp)
                .map((entry: IncidentLogEntry, idx: number) => {
                  const actorColors: Record<string, string> = {
                    system: 'bg-gray-400',
                    operator: 'bg-blue-500',
                    user: 'bg-green-500',
                  }
                  return (
                    <div key={idx} className="relative pl-10">
                      <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${actorColors[entry.actor] || actorColors.system}`} />
                      <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-semibold capitalize ${
                            entry.actor === 'operator' ? 'text-blue-600' :
                            entry.actor === 'user' ? 'text-green-600' :
                            'text-gray-500'
                          }`}>
                            {entry.actor}
                          </span>
                          <span className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{entry.message}</p>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
