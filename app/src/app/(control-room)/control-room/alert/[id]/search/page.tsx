'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ref, update } from 'firebase/database'
import { rtdb } from '@/lib/firebase/config'
import { useControlRoomStore } from '@/stores/control-room-store'
import { useAuthStore } from '@/stores/auth-store'
import type { Alert, Camera } from '@/types'

// Generate mock cameras near the alert location
function generateMockCameras(alertLat: number, alertLng: number, count: number): Camera[] {
  const cameraNames = [
    'High Street Junction NE',
    'Station Approach Cam 1',
    'Market Square PTZ',
    'Bus Stop A - Northbound',
    'Park Entrance Gate 3',
    'Underground Exit B',
    'Crosswalk Cam 7',
    'Shopping Centre East',
    'Car Park Level 2',
    'Footbridge South',
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `cam_${i}_${Date.now()}`,
    name: cameraNames[i % cameraNames.length],
    location: {
      lat: alertLat + (Math.random() - 0.5) * 0.003,
      lng: alertLng + (Math.random() - 0.5) * 0.003,
      accuracy: 5,
      timestamp: Date.now(),
    },
    locationName: cameraNames[i % cameraNames.length],
    type: Math.random() > 0.5 ? 'ptz' : 'fixed' as 'ptz' | 'fixed',
    status: Math.random() > 0.15 ? 'online' : 'offline' as 'online' | 'offline',
    controlRoomId: 'cr_london_central',
  }))
}

export default function CCTVSearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: alertId } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const { alerts, setAlerts, addLogEntry, incidentLog } = useControlRoomStore()

  const [alert, setAlert] = useState<Alert | null>(null)
  const [cameras, setCameras] = useState<Camera[]>([])
  const [locating, setLocating] = useState(false)
  const [searching, setSearching] = useState(false)

  // Find alert from store
  useEffect(() => {
    const found = alerts.find((a) => a.id === alertId)
    if (found) {
      setAlert(found)
      // Generate mock cameras near alert location
      const mockCameras = generateMockCameras(
        found.location.lat,
        found.location.lng,
        Math.floor(Math.random() * 4) + 4
      )
      setCameras(mockCameras)
    }
  }, [alertId, alerts])

  const handleIncidentLocated = async () => {
    if (!alert || !user) return
    setLocating(true)

    try {
      // Update RTDB
      await update(ref(rtdb, `activeAlerts/${alertId}`), {
        status: 'monitoring',
        operatorStatus: 'visual_confirmed',
        updatedAt: Date.now(),
      })

      // Update store
      const now = Date.now()
      const updatedAlert: Alert = {
        ...alert,
        status: 'monitoring',
        operatorStatus: 'visual_confirmed',
        locatedAt: now,
        incidentLog: [
          ...alert.incidentLog,
          {
            timestamp: now,
            message: `Incident visually confirmed by ${user.fullName}`,
            actor: 'operator',
          },
        ],
      }

      setAlert(updatedAlert)
      setAlerts(alerts.map((a) => (a.id === alertId ? updatedAlert : a)))
      addLogEntry(`Incident visually confirmed by ${user.fullName}`, 'operator')

      // Call API
      try {
        const idToken = await (await import('@/lib/firebase/config')).auth.currentUser?.getIdToken()
        if (idToken) {
          await fetch(`/api/alerts/${alertId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              status: 'monitoring',
              operatorStatus: 'visual_confirmed',
            }),
          })
        }
      } catch (apiErr) {
        console.error('API update error (continuing with local state):', apiErr)
      }

      router.push(`/alert/${alertId}/monitoring`)
    } catch (error) {
      console.error('Locate incident error:', error)
      setLocating(false)
    }
  }

  const handleStillSearching = () => {
    setSearching(true)
    addLogEntry('Operator still searching -- scanning additional cameras', 'operator')

    if (alert) {
      const now = Date.now()
      const updatedAlert: Alert = {
        ...alert,
        incidentLog: [
          ...alert.incidentLog,
          {
            timestamp: now,
            message: 'Operator still searching -- scanning additional cameras',
            actor: 'operator',
          },
        ],
      }
      setAlert(updatedAlert)
      setAlerts(alerts.map((a) => (a.id === alertId ? updatedAlert : a)))
    }

    setTimeout(() => setSearching(false), 1000)
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
  const onlineCameras = cameras.filter((c) => c.status === 'online')
  const offlineCameras = cameras.filter((c) => c.status === 'offline')

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Status Banner */}
      <div
        className="rounded-2xl p-4 mb-6 border"
        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse-opacity" />
          <p className="text-[13px] font-semibold text-slate-200">
            Operator has accepted — scanning cameras
          </p>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 ml-6">
          Alert ID: {alertId.substring(0, 12)}... | {isRed ? 'RED' : 'BLUE'} Alert | {alert.locationName}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Camera List + Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Camera Grid */}
          <div>
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3">
              Available Cameras ({onlineCameras.length} online, {offlineCameras.length} offline)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  className={`rounded-xl p-4 border ${
                    camera.status === 'online'
                      ? 'border-green-500/20'
                      : 'border-red-500/20 opacity-50'
                  }`}
                  style={{ backgroundColor: '#1e293b' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-[13px] font-semibold text-slate-200">
                        {camera.name}
                      </span>
                    </div>
                    <span
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border"
                      style={{
                        color: camera.type === 'ptz' ? '#3b82f6' : '#94a3b8',
                        borderColor: camera.type === 'ptz' ? '#3b82f6' : '#334155',
                      }}
                    >
                      {camera.type}
                    </span>
                  </div>

                  {camera.status === 'online' && (
                    <div className="mt-2 rounded-lg overflow-hidden bg-slate-900 h-24 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider">Live Feed</p>
                        <div className="flex items-center gap-1 mt-1 justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-opacity" />
                          <span className="text-[10px] text-red-400">REC</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 mt-2">
                    {camera.locationName}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Map Placeholder */}
          <div
            className="rounded-2xl p-6 border h-64 flex items-center justify-center"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-400 font-medium">Camera Position Map</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {onlineCameras.length} camera{onlineCameras.length !== 1 ? 's' : ''} plotted near alert location
              </p>
              <p className="text-[11px] text-blue-400 mt-1">
                ///{alert.what3words}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleIncidentLocated}
              disabled={locating}
              className="flex-1 px-6 py-4 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              {locating && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {locating ? 'Updating...' : 'Incident Located'}
            </button>

            <button
              onClick={handleStillSearching}
              disabled={searching}
              className="px-6 py-4 text-sm font-semibold text-slate-300 rounded-xl border hover:border-slate-400 transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
            >
              {searching ? 'Logged' : 'Still Searching'}
            </button>
          </div>
        </div>

        {/* Right: Incident Log */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-5 border"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          >
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
              Incident Log
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {incidentLog.length > 0 ? (
                incidentLog.map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          entry.actor === 'system'
                            ? 'bg-slate-500'
                            : entry.actor === 'operator'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-[13px] text-slate-300">{entry.message}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {alert.incidentLog.map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            entry.actor === 'system'
                              ? 'bg-slate-500'
                              : entry.actor === 'operator'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-[13px] text-slate-300">{entry.message}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(entry.timestamp).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
