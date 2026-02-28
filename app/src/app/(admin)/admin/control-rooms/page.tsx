'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import type { ControlRoom } from '@/types'

interface ControlRoomListItem extends ControlRoom {
  operatorCount: number
  alertsToday: number
}

export default function ControlRoomsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rooms, setRooms] = useState<ControlRoomListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: '24/7',
    coveragePostcodes: '',
  })
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/control-rooms')
      if (!res.ok) throw new Error('Failed to load control rooms')
      const data = await res.json()
      setRooms(data.controlRooms || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowAddModal(true)
    }
  }, [searchParams])

  const handleAddRoom = async () => {
    setAddError('')

    if (!addForm.name.trim()) {
      setAddError('Control room name is required')
      return
    }
    if (!addForm.email.trim()) {
      setAddError('Email is required')
      return
    }

    setAddLoading(true)
    try {
      const res = await fetch('/api/admin/control-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          coveragePostcodes: addForm.coveragePostcodes
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create control room')
      }

      setShowAddModal(false)
      setAddForm({ name: '', address: '', phone: '', email: '', operatingHours: '24/7', coveragePostcodes: '' })
      fetchRooms()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create control room')
    } finally {
      setAddLoading(false)
    }
  }

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(search.toLowerCase()) ||
      room.address.toLowerCase().includes(search.toLowerCase()) ||
      room.coveragePostcodes.some((p) => p.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && room.isActive) ||
      (statusFilter === 'inactive' && !room.isActive)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Control Rooms</h1>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-32" />
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
        <h1 className="text-2xl font-bold text-gray-900">Control Rooms</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Control Room
        </Button>
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
            placeholder="Search by name, address, or postcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-colors ${
                statusFilter === s
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Coverage Area</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Operators</th>
                <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase">Alerts Today</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    {search || statusFilter !== 'all' ? 'No control rooms match your filters' : 'No control rooms found'}
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    onClick={() => router.push(`/admin/control-rooms/${room.id}`)}
                    className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="font-medium text-gray-900">{room.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{room.address}</div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {room.coveragePostcodes.slice(0, 3).map((p) => (
                          <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                        {room.coveragePostcodes.length > 3 && (
                          <span className="text-xs text-gray-400">+{room.coveragePostcodes.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-gray-700 font-medium">{room.operatorCount ?? room.operators?.length ?? 0}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        room.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${room.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="text-gray-700 font-medium">{room.alertsToday ?? 0}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Control Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Add Control Room</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {addError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{addError}</div>
              )}
              <Input
                label="Name"
                placeholder="e.g., Birmingham City Centre"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
              <Input
                label="Address"
                placeholder="Full address"
                value={addForm.address}
                onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  placeholder="Phone number"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="Email address"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>
              <Input
                label="Operating Hours"
                placeholder="e.g., 24/7 or Mon-Fri 06:00-22:00"
                value={addForm.operatingHours}
                onChange={(e) => setAddForm({ ...addForm, operatingHours: e.target.value })}
              />
              <Input
                label="Coverage Postcodes"
                placeholder="Comma-separated, e.g., B1, B2, B3"
                value={addForm.coveragePostcodes}
                onChange={(e) => setAddForm({ ...addForm, coveragePostcodes: e.target.value })}
                hint="Enter postcodes separated by commas"
              />
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleAddRoom} loading={addLoading}>
                Create Control Room
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
