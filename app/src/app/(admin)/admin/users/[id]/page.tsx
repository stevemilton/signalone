'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import type { User, SanctionLevel, Alert, WelfareBooking } from '@/types'

interface UserDetail extends User {
  controlRoomName: string | null
  alertHistory: Alert[]
  welfareBookings: WelfareBooking[]
  sanctionHistory: { level: SanctionLevel; appliedAt: number; appliedBy: string }[]
}

const sanctionLabels: Record<SanctionLevel, string> = {
  none: 'None',
  warning_1: 'Warning 1',
  warning_2: 'Warning 2',
  restricted: 'Restricted (1/week for 6 months)',
  banned_3m: 'Banned 3 months',
  banned_permanent: 'Permanent Ban',
}

const sanctionColors: Record<SanctionLevel, string> = {
  none: 'bg-green-100 text-green-700',
  warning_1: 'bg-amber-100 text-amber-700',
  warning_2: 'bg-orange-100 text-orange-700',
  restricted: 'bg-red-100 text-red-700',
  banned_3m: 'bg-red-200 text-red-800',
  banned_permanent: 'bg-red-300 text-red-900',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(seconds: number | null) {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Sanction
  const [selectedSanction, setSelectedSanction] = useState<SanctionLevel>('none')
  const [sanctionLoading, setSanctionLoading] = useState(false)

  // Account actions
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error('Failed to load user')
      const data = await res.json()
      setUser(data.user)
      setSelectedSanction(data.user.sanctionLevel)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const handleApplySanction = async () => {
    if (selectedSanction === user?.sanctionLevel) return

    setSanctionLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/admin/users/${userId}/sanction`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sanctionLevel: selectedSanction }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to apply sanction')
      }
      setSuccess('Sanction updated successfully')
      fetchUser()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sanction')
    } finally {
      setSanctionLoading(false)
    }
  }

  const handleDisableAccount = async () => {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}/disable`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disable account')
      }
      setSuccess('Account disabled')
      setShowDisableConfirm(false)
      fetchUser()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable account')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setActionLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete account')
      }
      router.replace('/admin/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setActionLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Loading user...</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
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

  if (!user) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.push('/admin/users')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Users
        </button>
        <Card variant="danger">
          <p className="text-red-700 text-sm">{error || 'User not found'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/users')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
          {user.photoUrl && (
            <div className="mb-4">
              <img
                src={user.photoUrl}
                alt={user.fullName}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          )}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-800 font-medium">{user.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Address</span>
              <span className="text-gray-800 font-medium text-right max-w-[60%]">{user.address || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Emergency Contact</span>
              <span className="text-gray-800 font-medium text-right">
                {user.emergencyContactName ? `${user.emergencyContactName} (${user.emergencyContactPhone})` : 'N/A'}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3" />
            <div className="flex justify-between">
              <span className="text-gray-500">Postcode</span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium">{user.riskPostcode || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Safety Zone</span>
              <span className="text-gray-800 font-medium">{user.safetyZone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Control Room</span>
              <span className="text-gray-800 font-medium">{user.controlRoomName || 'Unlinked'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID Verified</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.idVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {user.idVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Registered</span>
              <span className="text-gray-800 text-xs">{formatDate(user.createdAt)}</span>
            </div>
          </div>
        </Card>

        {/* Sanction Management */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sanction Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Current:</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sanctionColors[user.sanctionLevel]}`}>
                {sanctionLabels[user.sanctionLevel]}
              </span>
            </div>
            {user.sanctionExpiresAt && (
              <p className="text-xs text-gray-500">
                Expires: {formatDate(user.sanctionExpiresAt)}
              </p>
            )}

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Apply / Change Sanction</label>
              <select
                value={selectedSanction}
                onChange={(e) => setSelectedSanction(e.target.value as SanctionLevel)}
                className="w-full px-3.5 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors mb-3"
              >
                {(Object.keys(sanctionLabels) as SanctionLevel[]).map((level) => (
                  <option key={level} value={level}>{sanctionLabels[level]}</option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleApplySanction}
                loading={sanctionLoading}
                disabled={selectedSanction === user.sanctionLevel}
              >
                Apply Sanction
              </Button>
            </div>

            {/* Sanction History */}
            {user.sanctionHistory && user.sanctionHistory.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">History</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {user.sanctionHistory.map((entry, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className={`font-medium px-2 py-0.5 rounded-full ${sanctionColors[entry.level]}`}>
                        {sanctionLabels[entry.level]}
                      </span>
                      <span className="text-gray-400">{formatDate(entry.appliedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Account Actions */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
          <div className="space-y-3">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setShowDisableConfirm(true)}
            >
              Disable Account
            </Button>
            <Button
              variant="danger"
              size="sm"
              fullWidth
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          </div>

          {/* Disable Confirmation */}
          {showDisableConfirm && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 mb-3">
                Are you sure you want to disable this account? The user will not be able to send alerts.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowDisableConfirm(false)}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={handleDisableAccount} loading={actionLoading}>Confirm Disable</Button>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800 mb-3">
                This action is permanent and cannot be undone. All user data will be deleted.
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="danger" size="sm" onClick={handleDeleteAccount} loading={actionLoading}>Confirm Delete</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Alert History */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert History</h2>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Classification</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Control Room</th>
              </tr>
            </thead>
            <tbody>
              {(!user.alertHistory || user.alertHistory.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No alert history</td>
                </tr>
              ) : (
                user.alertHistory.map((alert) => (
                  <tr key={alert.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{formatDateTime(alert.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-semibold uppercase ${alert.alertType === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                        {alert.alertType}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {alert.classification ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          alert.classification === 'genuine' ? 'bg-green-100 text-green-700' :
                          alert.classification === 'false_alert' ? 'bg-amber-100 text-amber-700' :
                          alert.classification === 'malicious' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {alert.classification.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{formatDuration(alert.duration)}</td>
                    <td className="py-3 text-gray-600">{alert.controlRoomId.slice(0, 12)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Welfare Bookings */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Welfare Bookings</h2>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody>
              {(!user.welfareBookings || user.welfareBookings.length === 0) ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No welfare bookings</td>
                </tr>
              ) : (
                user.welfareBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-600">{booking.scheduledDate}</td>
                    <td className="py-3 pr-4 text-gray-600">{booking.scheduledTime}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'missed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{booking.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
