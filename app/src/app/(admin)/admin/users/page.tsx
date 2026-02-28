'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import type { SanctionLevel } from '@/types'

interface UserRow {
  id: string
  fullName: string
  email: string
  riskPostcode: string
  controlRoomName: string | null
  sanctionLevel: SanctionLevel
  alertsToday: number
  createdAt: number
}

const sanctionLabels: Record<SanctionLevel, string> = {
  none: 'None',
  warning_1: 'Warning 1',
  warning_2: 'Warning 2',
  restricted: 'Restricted',
  banned_3m: 'Banned 3m',
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

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sanctionFilter, setSanctionFilter] = useState<SanctionLevel | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      })
      if (search) params.set('search', search)
      if (sanctionFilter !== 'all') params.set('sanctionLevel', sanctionFilter)

      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [page, search, sanctionFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers()
    }, 300)
    return () => clearTimeout(debounce)
  }, [fetchUsers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="text-sm text-gray-400">{users.length} results</div>
      </div>

      {error && (
        <Card variant="danger">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or postcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div>
          <select
            value={sanctionFilter}
            onChange={(e) => {
              setSanctionFilter(e.target.value as SanctionLevel | 'all')
              setPage(1)
            }}
            className="w-full sm:w-auto px-3.5 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="all">All Sanction Levels</option>
            {(Object.keys(sanctionLabels) as SanctionLevel[]).map((level) => (
              <option key={level} value={level}>{sanctionLabels[level]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Postcode</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Control Room</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Sanction</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Alerts</th>
                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Registered</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td colSpan={7} className="py-4">
                      <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {search || sanctionFilter !== 'all' ? 'No users match your filters' : 'No users found'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 pr-4 font-medium text-gray-900 whitespace-nowrap">{user.fullName}</td>
                    <td className="py-3.5 pr-4 text-gray-600">{user.email}</td>
                    <td className="py-3.5 pr-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {user.riskPostcode || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-600 whitespace-nowrap">{user.controlRoomName || 'Unlinked'}</td>
                    <td className="py-3.5 pr-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sanctionColors[user.sanctionLevel]}`}>
                        {sanctionLabels[user.sanctionLevel]}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-gray-700 font-medium">{user.alertsToday}</td>
                    <td className="py-3.5 text-gray-500 text-xs whitespace-nowrap">{formatDate(user.createdAt)}</td>
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
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
