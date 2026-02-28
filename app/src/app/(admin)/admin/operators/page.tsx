'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'

interface OperatorRow {
  id: string
  userId: string
  fullName: string
  email: string
  controlRoomId: string
  controlRoomName: string
  status: 'available' | 'busy' | 'on_break' | 'offline'
  alertsHandled: number
  lastActive: number | null
}

interface ControlRoomOption {
  id: string
  name: string
}

function formatRelativeTime(ts: number | null) {
  if (!ts) return 'Never'
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    busy: 'bg-amber-100 text-amber-700',
    on_break: 'bg-blue-100 text-blue-700',
    offline: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status] || map.offline}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function OperatorsPage() {
  const searchParams = useSearchParams()
  const [operators, setOperators] = useState<OperatorRow[]>([])
  const [controlRooms, setControlRooms] = useState<ControlRoomOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Add / Edit modal
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    controlRoomId: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchOperators = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/operators')
      if (!res.ok) throw new Error('Failed to load operators')
      const data = await res.json()
      setOperators(data.operators || [])
      setControlRooms(data.controlRooms || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOperators()
  }, [fetchOperators])

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowModal(true)
    }
  }, [searchParams])

  const openAddModal = () => {
    setEditId(null)
    setFormData({ fullName: '', email: '', password: '', controlRoomId: '' })
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (op: OperatorRow) => {
    setEditId(op.id)
    setFormData({
      fullName: op.fullName,
      email: op.email,
      password: '',
      controlRoomId: op.controlRoomId,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setFormError('')

    if (!formData.fullName.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formData.email.trim()) {
      setFormError('Email is required')
      return
    }
    if (!editId && !formData.password.trim()) {
      setFormError('Password is required for new operators')
      return
    }
    if (!formData.controlRoomId) {
      setFormError('Please assign a control room')
      return
    }

    setFormLoading(true)
    try {
      const url = editId ? `/api/admin/operators/${editId}` : '/api/admin/operators'
      const method = editId ? 'PUT' : 'POST'

      const body: Record<string, string> = {
        fullName: formData.fullName,
        email: formData.email,
        controlRoomId: formData.controlRoomId,
      }
      if (formData.password) {
        body.password = formData.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save operator')
      }

      setShowModal(false)
      fetchOperators()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setFormLoading(false)
    }
  }

  const filteredOperators = operators.filter((op) =>
    op.fullName.toLowerCase().includes(search.toLowerCase()) ||
    op.email.toLowerCase().includes(search.toLowerCase()) ||
    op.controlRoomName.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-28" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Operators</h1>
        <Button variant="primary" size="sm" onClick={openAddModal}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Operator
        </Button>
      </div>

      {error && (
        <Card variant="danger">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search by name, email, or control room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Control Room</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Alerts Handled</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Last Active</th>
                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    {search ? 'No operators match your search' : 'No operators found'}
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op) => (
                  <tr key={op.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 pr-4 font-medium text-gray-900">{op.fullName}</td>
                    <td className="py-3.5 pr-4 text-gray-600">{op.email}</td>
                    <td className="py-3.5 pr-4 text-gray-600">{op.controlRoomName}</td>
                    <td className="py-3.5 pr-4">{statusBadge(op.status)}</td>
                    <td className="py-3.5 pr-4 text-gray-700 font-medium">{op.alertsHandled}</td>
                    <td className="py-3.5 pr-4 text-gray-500 text-xs">{formatRelativeTime(op.lastActive)}</td>
                    <td className="py-3.5">
                      <button
                        onClick={() => openEditModal(op)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {editId ? 'Edit Operator' : 'Add Operator'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{formError}</div>
              )}
              <Input
                label="Full Name"
                placeholder="Operator name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                placeholder="operator@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label={editId ? 'New Password (leave blank to keep current)' : 'Password'}
                type="password"
                placeholder={editId ? 'Leave blank to keep current' : 'Create password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Assign to Control Room</label>
                <select
                  value={formData.controlRoomId}
                  onChange={(e) => setFormData({ ...formData, controlRoomId: e.target.value })}
                  className="w-full px-3.5 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="">Select a control room...</option>
                  {controlRooms.map((cr) => (
                    <option key={cr.id} value={cr.id}>{cr.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} loading={formLoading}>
                {editId ? 'Save Changes' : 'Create Operator'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
