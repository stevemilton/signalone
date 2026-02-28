'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase/config'
import { useAuthStore } from '@/stores/auth-store'
import { useAlertStore } from '@/stores/alert-store'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useAuth } from '@/hooks/useAuth'
import type { AlertType } from '@/types'

function AlertButton({
  type,
  onActivated,
  disabled,
}: {
  type: AlertType
  onActivated: () => void
  disabled: boolean
}) {
  const [holding, setHolding] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const activatedRef = useRef(false)

  const isBlue = type === 'blue'

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleStart = useCallback(() => {
    if (disabled) return
    activatedRef.current = false
    setHolding(true)
    setCountdown(3)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.ceil((3000 - elapsed) / 1000)

      if (remaining <= 0) {
        clearTimers()
        setHolding(false)
        setCountdown(3)
        if (!activatedRef.current) {
          activatedRef.current = true
          onActivated()
        }
      } else {
        setCountdown(remaining)
      }
    }, 100)
  }, [disabled, onActivated, clearTimers])

  const handleEnd = useCallback(() => {
    clearTimers()
    setHolding(false)
    setCountdown(3)
  }, [clearTimers])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  return (
    <button
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStart() } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleEnd() } }}
      onBlur={handleEnd}
      disabled={disabled}
      className={`
        w-full rounded-2xl p-6 text-left transition-transform duration-150 select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${holding ? 'scale-[0.97]' : 'scale-100'}
        ${isBlue
          ? 'bg-gradient-to-br from-blue-700 to-blue-500 border-[3px] border-blue-400 shadow-lg shadow-blue-500/30'
          : 'bg-gradient-to-br from-red-800 to-red-600 border-[3px] border-red-400 shadow-lg shadow-red-500/30'
        }
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBlue ? 'bg-blue-400/30' : 'bg-red-400/30'}`}>
          {isBlue ? (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-white font-extrabold text-lg leading-tight">
            {holding
              ? `Hold... ${countdown}`
              : isBlue
                ? "I Don't Feel Safe"
                : 'I Am In Danger'
            }
          </p>
        </div>
      </div>
      <p className="text-white/80 text-xs leading-relaxed">
        {isBlue
          ? 'Anonymous alert. Your identity will NOT be shared with the control room.'
          : 'Identified alert. Your name, age, and photo WILL be shared to help operators find you.'
        }
      </p>
      <p className={`text-xs mt-2 font-semibold ${isBlue ? 'text-blue-200' : 'text-red-200'}`}>
        Hold for 3 seconds to activate
      </p>
    </button>
  )
}

export default function AlertPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { setAlertType, setActiveAlert, setAlertStartTime } = useAlertStore()
  const { getCurrentPosition } = useGeolocation()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const handleAlertActivated = useCallback(async (type: AlertType) => {
    if (sending || !user) return
    setSending(true)
    setError('')
    setAlertType(type)

    try {
      // Get current location
      const location = await getCurrentPosition()

      if (!location) {
        setError('Unable to get your location. Please enable location services and try again.')
        setSending(false)
        return
      }

      // Get auth token
      const currentUser = auth.currentUser
      if (!currentUser) {
        setError('You need to be signed in to raise an alert.')
        setSending(false)
        return
      }

      const idToken = await currentUser.getIdToken()

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          alertType: type,
          location: {
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          },
          riskPostcode: user.riskPostcode || user.safetyZone || '',
          locationName: user.locationName || '',
          what3words: user.what3words || '',
          additionalInfo: '',
          passengerFeelsSafe: false,
          userName: type === 'red' ? user.fullName : null,
          userAge: null,
          userPhoto: type === 'red' ? user.photoUrl : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send alert')
        setSending(false)
        return
      }

      setActiveAlert(data.alert)
      setAlertStartTime(Date.now())

      router.push('/alert/sent')
    } catch {
      setError('Failed to send alert. Please try again.')
      setSending(false)
    }
  }, [sending, user, getCurrentPosition, setAlertType, setActiveAlert, setAlertStartTime, router])

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
        <p className="text-[14px] text-slate-600 mb-4">Please sign in to continue</p>
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-8 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">👤</span>
              )}
            </div>
            <div>
              <p className="text-white text-[14px] font-bold">Hi, {user.fullName.split(' ')[0]}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-blue-200 text-xs">Connected</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-5 pb-[100px]">
        {/* 999 Warning Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-red-500 rounded-xl p-3.5 mb-5">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-white text-xs font-extrabold">ALWAYS CALL 999 FIRST</p>
              <p className="text-white/90 text-[10px]">If you are in immediate danger, call 999 before using this app</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 mb-4 animate-fade-in">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Alert Buttons */}
        <div className="space-y-4">
          <AlertButton
            type="blue"
            onActivated={() => handleAlertActivated('blue')}
            disabled={sending}
          />

          <AlertButton
            type="red"
            onActivated={() => handleAlertActivated('red')}
            disabled={sending}
          />
        </div>

        {sending && (
          <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 animate-fade-in">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-xs font-medium">Sending alert...</span>
          </div>
        )}

        {/* CCTV Coverage Link */}
        <button
          onClick={() => router.push('/map')}
          className="w-full mt-6 flex items-center justify-between p-3.5 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-[14px] font-semibold text-slate-700">View CCTV Coverage</span>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
