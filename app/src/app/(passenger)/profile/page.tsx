'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils/format'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import type { Alert } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { logout } = useAuthStore()
  const [alertHistory, setAlertHistory] = useState<Alert[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    if (!auth.currentUser) {
      setHistoryLoading(false)
      return
    }

    try {
      const idToken = await auth.currentUser.getIdToken()
      const res = await fetch('/api/alerts?status=closed,cancelled&limit=20', {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      if (res.ok) {
        const data = await res.json()
        setAlertHistory(data.alerts || [])
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory()
    } else if (!authLoading) {
      setHistoryLoading(false)
    }
  }, [authLoading, user, fetchHistory])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      logout()
      localStorage.removeItem('esaf_returning_user')
      router.push('/')
    } catch {
      // Force redirect on error
      logout()
      router.push('/')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <p className="text-[14px] text-slate-600 mb-4">Please sign in to view your profile</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-10 pb-8 relative">
        <button
          onClick={() => router.push('/alert')}
          className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          {/* Profile Photo */}
          <div className="w-[100px] h-[100px] rounded-full border-[3px] border-blue-400 bg-white/10 flex items-center justify-center overflow-hidden mx-auto mb-3">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          <h1 className="text-[24px] font-extrabold text-white">{user.fullName}</h1>
          <p className="text-blue-200 text-[14px]">{user.email}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        {/* Personal Details */}
        <Card className="mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Personal Details</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Full Name</p>
              <p className="text-[14px] font-semibold text-slate-900">{user.fullName}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-[14px] font-semibold text-slate-900">{user.email}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-[14px] font-semibold text-slate-900">{user.phone}</p>
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Emergency Contact</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Name</p>
              <p className="text-[14px] font-semibold text-slate-900">{user.emergencyContactName}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-[14px] font-semibold text-slate-900">{user.emergencyContactPhone}</p>
            </div>
          </div>
        </Card>

        {/* Safety Zone */}
        <Card className="mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Safety Zone</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Postcode</p>
              <p className="text-[14px] font-semibold text-slate-900">{user.riskPostcode || user.safetyZone || 'Not set'}</p>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Control Room</p>
              <p className="text-[14px] font-semibold text-slate-900">{user.controlRoomId ? 'Herts CCTV Partnership' : 'Not linked'}</p>
            </div>
          </div>
        </Card>

        {/* Edit Profile */}
        <Button
          fullWidth
          size="md"
          variant="outline"
          className="mb-6"
        >
          Edit Profile
        </Button>

        {/* Alert History */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Alert History</p>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : alertHistory.length > 0 ? (
            <div className="space-y-2">
              {alertHistory.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    alert.alertType === 'red' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      alert.alertType === 'red' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900">
                      {alert.alertType === 'red' ? 'Red' : 'Blue'} Alert
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(alert.createdAt)}</p>
                  </div>
                  {alert.classification && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alert.classification === 'genuine'
                        ? 'bg-green-100 text-green-700'
                        : alert.classification === 'false_alert'
                          ? 'bg-amber-100 text-amber-700'
                          : alert.classification === 'malicious'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                      {alert.classification.replace('_', ' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl p-6 text-center">
              <p className="text-xs text-slate-400">No alert history</p>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <Button
          fullWidth
          size="lg"
          variant="danger"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}
