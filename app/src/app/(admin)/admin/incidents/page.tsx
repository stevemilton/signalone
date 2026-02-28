'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import type { AlertType, AlertClassification } from '@/types'

interface IncidentRow {
  id: string
  referenceNumber: string
  alertType: AlertType
  userId: string
  userName: string
  operatorId: string
  operatorName: string
  controlRoomId: string
  controlRoomName: string
  classification: AlertClassification | null
  duration: number
  status: string
  createdAt: number
  closedAt: number
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

const classificationColors: Record<string, string> = {
  genuine: 'bg-green-100 text-green-700',
  false_alert: 'bg-amber-100 text-amber-700',
  malicious: 'bg-red-100 text-red-700',
  unclear: 'bg-gray-100 text-gray-600',
}

export default function IncidentsPage() {
  const router = useRouter()
  const [incidents, setIncidents] = useState<IncidentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [controlRoomFilter, setControlRoomFilter] = useState('')
  const [classificationFilter, setClassificationFilter] = useState<AlertClassification | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [controlRooms, setControlRooms] = useState<{ id: string; name: string }[]>([])

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' })
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (controlRoomFilter) params.set('controlRoomId', controlRoomFilter)
      if (classificationFilter !== 'all') params.set('classification', classificationFilter)
      if (typeFilter !== 'all') params.set('alertType', typeFilter)

      const res = await fetch(`/api/admin/incidents?${params}`)
      if (!res.ok) throw new Error('Failed to load incidents')
      const data = await res.json()
      setIncidents(data.incidents || [])
      setTotalPages(data.totalPages || 1)
      if (data.controlRooms) setControlRooms(data.controlRooms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, controlRoomFilter, classificationFilter, typeFilter])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (controlRoomFilter) params.set('controlRoomId', controlRoomFilter)
      if (classificationFilter !== 'all') params.set('classification', classificationFilter)
      if (typeFilter !== 'all') params.set('alertType', typeFilter)
      params.set('format', 'csv')

      const res = await fetch(`/api/admin/incidents/export?${params}`)
      if (!res.ok) throw new Error('Failed to export data')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
        <Button variant="outline" size="sm" onClick={handleExportCSV} loading={exporting}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </Button>
      </div>

      {error && (
        <Card variant="danger">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Control Room</label>
            <select
              value={controlRoomFilter}
              onChange={(e) => { setControlRoomFilter(e.target.value); setPage(1) }}
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">All Control Rooms</option>
              {controlRooms.map((cr) => (
                <option key={cr.id} value={cr.id}>{cr.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Classification</label>
            <select
              value={classificationFilter}
              onChange={(e) => { setClassificationFilter(e.target.value as AlertClassification | 'all'); setPage(1) }}
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Classifications</option>
              <option value="genuine">Genuine</option>
              <option value="false_alert">False Alert</option>
              <option value="malicious">Malicious</option>
              <option value="unclear">Unclear</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Alert Type</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as AlertType | 'all'); setPage(1) }}
              className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="blue">Blue</option>
              <option value="red">Red</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Ref #</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Operator</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Classification</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td colSpan={8} className="py-4">
                      <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">No incidents found</td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => router.push(`/admin/incidents/${incident.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/admin/incidents/${incident.id}`) }}
                    tabIndex={0}
                    className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors focus-visible:bg-blue-50 focus-visible:outline-none"
                  >
                    <td className="py-3.5 pr-4">
                      <span className="text-xs font-mono font-medium text-blue-600">{incident.referenceNumber}</span>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-600 whitespace-nowrap">{formatDateTime(incident.createdAt)}</td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase ${incident.alertType === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${incident.alertType === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        {incident.alertType}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-700 whitespace-nowrap">{incident.userName || incident.userId.slice(0, 8)}</td>
                    <td className="py-3.5 pr-4 text-gray-600 whitespace-nowrap">{incident.operatorName || incident.operatorId.slice(0, 8)}</td>
                    <td className="py-3.5 pr-4">
                      {incident.classification ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classificationColors[incident.classification]}`}>
                          {incident.classification.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-600">{formatDuration(incident.duration)}</td>
                    <td className="py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        incident.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                        incident.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
