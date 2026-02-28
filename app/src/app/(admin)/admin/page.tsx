'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import type { Alert, AlertClassification } from '@/types'

interface DashboardData {
  totalUsers: number
  userGrowth: number
  activeControlRooms: number
  alertsToday: number
  activeIncidents: number
  recentAlerts: Alert[]
  systemHealth: {
    firebaseStatus: 'online' | 'offline' | 'degraded'
    rtdbLatency: number
    activeConnections: number
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function classificationBadge(classification: AlertClassification | null) {
  const colors: Record<string, string> = {
    genuine: 'bg-green-100 text-green-700',
    false_alert: 'bg-amber-100 text-amber-700',
    malicious: 'bg-red-100 text-red-700',
    unclear: 'bg-gray-100 text-gray-600',
  }
  if (!classification) return <span className="text-xs text-gray-400">Pending</span>
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[classification] || colors.unclear}`}>
      {classification.replace('_', ' ')}
    </span>
  )
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    awaiting_review: 'bg-blue-100 text-blue-700',
    accepted: 'bg-blue-100 text-blue-700',
    searching: 'bg-purple-100 text-purple-700',
    monitoring: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-gray-100 text-gray-500',
    expired: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function healthDot(status: string) {
  if (status === 'online') return 'bg-green-500'
  if (status === 'degraded') return 'bg-amber-500'
  return 'bg-red-500'
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) throw new Error('Failed to load dashboard data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Card variant="danger">
          <p className="text-red-700 text-sm">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchDashboard}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Users',
      value: data?.totalUsers ?? 0,
      growth: data?.userGrowth ?? 0,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Control Rooms',
      value: data?.activeControlRooms ?? 0,
      growth: null,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Alerts Today',
      value: data?.alertsToday ?? 0,
      growth: null,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Active Incidents',
      value: data?.activeIncidents ?? 0,
      growth: null,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value.toLocaleString()}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${stat.color}`}>#</span>
              </div>
            </div>
            {stat.growth !== null && (
              <p className={`text-xs mt-2 ${stat.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stat.growth >= 0 ? '+' : ''}{stat.growth}% from last month
              </p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Alerts Table */}
        <div className="xl:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/incidents')}>
                View All
              </Button>
            </div>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Control Room</th>
                    <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentAlerts ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                        No recent alerts
                      </td>
                    </tr>
                  ) : (
                    (data?.recentAlerts ?? []).slice(0, 10).map((alert) => (
                      <tr key={alert.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                          {formatDate(alert.createdAt)} {formatTime(alert.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase ${alert.alertType === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${alert.alertType === 'red' ? 'bg-red-500' : 'bg-blue-500'}`} />
                            {alert.alertType}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-700 whitespace-nowrap">{alert.userName || alert.userId.slice(0, 8)}</td>
                        <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{alert.controlRoomId.slice(0, 12)}</td>
                        <td className="py-3 pr-4">{statusBadge(alert.status)}</td>
                        <td className="py-3">{classificationBadge(alert.classification)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* System Health + Quick Actions */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Firebase Status</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${healthDot(data?.systemHealth?.firebaseStatus ?? 'offline')}`} />
                  <span className="text-sm font-medium text-gray-800 capitalize">{data?.systemHealth?.firebaseStatus ?? 'unknown'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">RTDB Latency</span>
                <span className="text-sm font-medium text-gray-800">{data?.systemHealth?.rtdbLatency ?? 0}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Connections</span>
                <span className="text-sm font-medium text-gray-800">{data?.systemHealth?.activeConnections ?? 0}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="justify-start"
                onClick={() => router.push('/admin/control-rooms?action=add')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Control Room
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="justify-start"
                onClick={() => router.push('/admin/operators?action=add')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Operator
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                className="justify-start"
                onClick={() => router.push('/admin/analytics')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                View Reports
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
