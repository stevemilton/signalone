'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import type { ControlRoom, Camera, Alert, Operator } from '@/types'

interface ControlRoomDetail extends ControlRoom {
  operatorDetails: (Operator & { fullName: string; email: string })[]
  recentAlerts: Alert[]
  avgResponseTime: number
  alertsHandledTotal: number
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function ControlRoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [room, setRoom] = useState<ControlRoomDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: '',
    isActive: true,
  })
  const [postcodes, setPostcodes] = useState<string[]>([])
  const [postcodeInput, setPostcodeInput] = useState('')

  // Camera form
  const [showCameraForm, setShowCameraForm] = useState(false)
  const [cameraForm, setCameraForm] = useState({
    name: '',
    lat: '',
    lng: '',
    locationName: '',
    type: 'fixed' as 'fixed' | 'ptz',
  })
  const [cameraError, setCameraError] = useState('')
  const [cameraLoading, setCameraLoading] = useState(false)

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/control-rooms/${id}`)
      if (!res.ok) throw new Error('Failed to load control room')
      const data = await res.json()
      setRoom(data.controlRoom)
      setForm({
        name: data.controlRoom.name,
        address: data.controlRoom.address,
        phone: data.controlRoom.phone,
        email: data.controlRoom.email,
        operatingHours: data.controlRoom.operatingHours,
        isActive: data.controlRoom.isActive,
      })
      setPostcodes(data.controlRoom.coveragePostcodes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRoom()
  }, [fetchRoom])

  const handleAddPostcode = () => {
    const trimmed = postcodeInput.trim().toUpperCase()
    if (trimmed && !postcodes.includes(trimmed)) {
      setPostcodes([...postcodes, trimmed])
    }
    setPostcodeInput('')
  }

  const handleRemovePostcode = (pc: string) => {
    setPostcodes(postcodes.filter((p) => p !== pc))
  }

  const handlePostcodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddPostcode()
    }
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.email.trim()) {
      setError('Email is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/control-rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          coveragePostcodes: postcodes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      setSuccess('Control room updated successfully')
      fetchRoom()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCamera = async () => {
    setCameraError('')

    if (!cameraForm.name.trim()) {
      setCameraError('Camera name is required')
      return
    }
    if (!cameraForm.lat || !cameraForm.lng) {
      setCameraError('Latitude and longitude are required')
      return
    }
    if (isNaN(Number(cameraForm.lat)) || isNaN(Number(cameraForm.lng))) {
      setCameraError('Latitude and longitude must be valid numbers')
      return
    }

    setCameraLoading(true)
    try {
      const res = await fetch(`/api/admin/control-rooms/${id}/cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cameraForm.name,
          location: {
            lat: Number(cameraForm.lat),
            lng: Number(cameraForm.lng),
            accuracy: 10,
            timestamp: Date.now(),
          },
          locationName: cameraForm.locationName,
          type: cameraForm.type,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add camera')
      }

      setCameraForm({ name: '', lat: '', lng: '', locationName: '', type: 'fixed' })
      setShowCameraForm(false)
      fetchRoom()
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Failed to add camera')
    } finally {
      setCameraLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <Card variant="danger">
          <p className="text-red-700 text-sm">{error || 'Control room not found'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/control-rooms')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-sm text-gray-500">{room.address}</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details Form */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <Input
              label="Operating Hours"
              value={form.operatingHours}
              onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
            />

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold text-slate-700">Status</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <p className={`text-xs ${form.isActive ? 'text-green-600' : 'text-gray-500'}`}>
              {form.isActive ? 'Active — receiving alerts' : 'Inactive — not receiving alerts'}
            </p>

            {/* Coverage Postcodes */}
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Coverage Postcodes</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {postcodes.map((pc) => (
                  <span key={pc} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {pc}
                    <button
                      type="button"
                      onClick={() => handleRemovePostcode(pc)}
                      className="text-blue-400 hover:text-blue-600"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add postcode..."
                  value={postcodeInput}
                  onChange={(e) => setPostcodeInput(e.target.value)}
                  onKeyDown={handlePostcodeKeyDown}
                />
                <Button variant="secondary" size="sm" onClick={handleAddPostcode} className="shrink-0">
                  Add
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Metrics */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-medium text-blue-600 uppercase">Avg Response Time</p>
                <p className="text-2xl font-bold text-blue-800 mt-1">
                  {room.avgResponseTime ? `${Math.round(room.avgResponseTime)}s` : 'N/A'}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-xs font-medium text-emerald-600 uppercase">Alerts Handled</p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">{room.alertsHandledTotal ?? 0}</p>
              </div>
            </div>
          </Card>

          {/* Operators */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Operators</h2>
              <span className="text-xs text-gray-400">{room.operatorDetails?.length ?? 0} assigned</span>
            </div>
            {(!room.operatorDetails || room.operatorDetails.length === 0) ? (
              <p className="text-sm text-gray-400 py-4 text-center">No operators assigned</p>
            ) : (
              <div className="space-y-2">
                {room.operatorDetails.map((op) => (
                  <div key={op.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{op.fullName}</p>
                      <p className="text-xs text-gray-400">{op.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      op.status === 'available' ? 'bg-green-100 text-green-700' :
                      op.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                      op.status === 'on_break' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {op.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Camera Management */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cameras</h2>
          <Button variant="outline" size="sm" onClick={() => setShowCameraForm(!showCameraForm)}>
            {showCameraForm ? 'Cancel' : 'Add Camera'}
          </Button>
        </div>

        {showCameraForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            {cameraError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{cameraError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Camera Name"
                placeholder="e.g., High Street Cam 1"
                value={cameraForm.name}
                onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
              />
              <Input
                label="Location Name"
                placeholder="e.g., High Street / Market Square"
                value={cameraForm.locationName}
                onChange={(e) => setCameraForm({ ...cameraForm, locationName: e.target.value })}
              />
              <Input
                label="Latitude"
                placeholder="e.g., 52.4862"
                value={cameraForm.lat}
                onChange={(e) => setCameraForm({ ...cameraForm, lat: e.target.value })}
              />
              <Input
                label="Longitude"
                placeholder="e.g., -1.8904"
                value={cameraForm.lng}
                onChange={(e) => setCameraForm({ ...cameraForm, lng: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-[13px] font-semibold text-slate-700">Type:</label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="cameraType"
                  checked={cameraForm.type === 'fixed'}
                  onChange={() => setCameraForm({ ...cameraForm, type: 'fixed' })}
                  className="accent-blue-600"
                />
                Fixed
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="cameraType"
                  checked={cameraForm.type === 'ptz'}
                  onChange={() => setCameraForm({ ...cameraForm, type: 'ptz' })}
                  className="accent-blue-600"
                />
                PTZ
              </label>
            </div>
            <Button variant="primary" size="sm" onClick={handleAddCamera} loading={cameraLoading}>
              Add Camera
            </Button>
          </div>
        )}

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {(!room.cameras || room.cameras.length === 0) ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No cameras configured</td>
                </tr>
              ) : (
                room.cameras.map((cam: Camera) => (
                  <tr key={cam.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-800">{cam.name}</td>
                    <td className="py-3 pr-4 text-gray-600">{cam.locationName}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs uppercase font-medium text-gray-500">{cam.type}</span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        cam.status === 'online' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cam.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {cam.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alert History */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert History</h2>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">Classification</th>
              </tr>
            </thead>
            <tbody>
              {(!room.recentAlerts || room.recentAlerts.length === 0) ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No alerts recorded</td>
                </tr>
              ) : (
                room.recentAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{formatTime(alert.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-semibold uppercase ${alert.alertType === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
                        {alert.alertType}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        alert.status === 'closed' ? 'bg-gray-100 text-gray-600' :
                        alert.status === 'monitoring' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {alert.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3">
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
