'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Card } from '@/components/shared/Card'
import { auth as firebaseAuth } from '@/lib/firebase/config'

interface PublicCamera {
  id: string
  name: string
  locationName: string
  type: 'fixed' | 'ptz'
  status: 'online' | 'offline'
}

export default function MapPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [cameras, setCameras] = useState<PublicCamera[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCameras() {
      try {
        const idToken = await firebaseAuth.currentUser?.getIdToken()
        if (!idToken || !user?.controlRoomId) {
          // Try to find control room from user's risk postcode
          // For now, fall back to fetching without controlRoomId
          setLoading(false)
          return
        }

        const res = await fetch(`/api/control-rooms/${user.controlRoomId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        })

        if (!res.ok) {
          setLoading(false)
          return
        }

        const data = await res.json()
        const allCameras = data.controlRoom?.cameras || []

        // Strip sensitive fields — passengers only see name, location, type, status
        const publicCameras: PublicCamera[] = allCameras.map((cam: Record<string, unknown>) => ({
          id: cam.id as string,
          name: cam.name as string,
          locationName: (cam.locationName as string) || (cam.name as string),
          type: cam.type as 'fixed' | 'ptz',
          status: cam.status as 'online' | 'offline',
        }))

        setCameras(publicCameras)
      } catch (err) {
        console.error('Failed to fetch cameras:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCameras()
  }, [user?.controlRoomId])

  const onlineCameras = cameras.filter((c) => c.status === 'online')
  const offlineCameras = cameras.filter((c) => c.status === 'offline')

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-10 pb-6 relative">
        <button
          onClick={() => router.push('/alert')}
          className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[24px] font-extrabold text-white text-center">CCTV Coverage</h1>
        <p className="text-blue-100 text-[14px] mt-1 text-center">
          {user?.safetyZone || user?.riskPostcode || 'Your safety zone'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 pb-[100px]">
        {/* Stats */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-white border-2 border-slate-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-blue-700">{cameras.length}</p>
            <p className="text-xs text-slate-500 font-medium">Total Cameras</p>
          </div>
          <div className="flex-1 bg-white border-2 border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-green-600">{onlineCameras.length}</p>
            <p className="text-xs text-slate-500 font-medium">Online</p>
          </div>
          <div className="flex-1 bg-white border-2 border-red-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-extrabold text-red-600">{offlineCameras.length}</p>
            <p className="text-xs text-slate-500 font-medium">Offline</p>
          </div>
        </div>

        {/* Planning Tip */}
        <Card variant="blue" className="mb-5">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold">Planning tip:</span> Where possible, plan your route to stay within camera coverage areas for maximum safety.
            </p>
          </div>
        </Card>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading cameras...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && cameras.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No cameras available in your area yet.</p>
          </div>
        )}

        {/* Camera List */}
        {!loading && cameras.length > 0 && (
          <div className="space-y-1.5">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl"
              >
                <span className="text-base flex-shrink-0">
                  {camera.status === 'online' ? '📷' : '📷'}
                </span>
                <p className="text-xs text-slate-700 flex-1 leading-snug">{camera.name}</p>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  camera.status === 'online' ? 'bg-green-500' : 'bg-red-400'
                }`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
