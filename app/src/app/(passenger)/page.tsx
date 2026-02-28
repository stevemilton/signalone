'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'

interface ReturningUser {
  name: string
  email: string
  photoUrl: string | null
}

export default function WelcomePage() {
  const router = useRouter()
  const [returningUser, setReturningUser] = useState<ReturningUser | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('esaf_returning_user')
      if (stored) {
        setReturningUser(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const handleChangeUser = () => {
    localStorage.removeItem('esaf_returning_user')
    setReturningUser(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-16 pb-12 text-center">
        {/* Shield Icon */}
        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h1 className="text-[24px] font-extrabold text-white mb-2">E-SAF Civic</h1>
        <p className="text-blue-100 text-[14px] leading-relaxed max-w-xs mx-auto">
          Personal safety platform connecting you with your local CCTV control room
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-8 pb-[100px]">
        {/* Quick Login for Returning User */}
        {returningUser && (
          <div className="mb-8 animate-fade-in">
            <div
              className="bg-white border-2 border-blue-400 rounded-2xl p-5 cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => router.push('/login')}
              role="button"
              tabIndex={0}
            >
              <p className="text-xs font-semibold text-blue-600 mb-3 uppercase tracking-wide">Welcome back</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {returningUser.photoUrl ? (
                    <img
                      src={returningUser.photoUrl}
                      alt={returningUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-900 truncate">{returningUser.name}</p>
                  <p className="text-xs text-slate-500 truncate">{returningUser.email}</p>
                </div>
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <button
              onClick={handleChangeUser}
              className="w-full text-center text-xs text-slate-400 mt-2 py-1 hover:text-slate-600 transition-colors"
            >
              Change User
            </button>
          </div>
        )}

        {/* Auth Buttons */}
        <div className="space-y-3">
          <Button
            fullWidth
            size="lg"
            onClick={() => router.push('/register')}
          >
            Create Account
          </Button>

          <Button
            fullWidth
            size="lg"
            variant="outline"
            onClick={() => router.push('/login')}
          >
            Log In
          </Button>
        </div>

        {/* Staff Access */}
        <div className="mt-8 flex gap-2">
          <button
            onClick={() => router.push('/control-room/dashboard')}
            className="flex-1 text-xs text-slate-400 py-2 border border-slate-200 rounded-xl hover:text-slate-600 hover:border-slate-300 transition-colors"
          >
            Control Room
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="flex-1 text-xs text-slate-400 py-2 border border-slate-200 rounded-xl hover:text-slate-600 hover:border-slate-300 transition-colors"
          >
            Admin Panel
          </button>
        </div>

        {/* Warning Notice */}
        <div className="mt-6 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Important</p>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            E-SAF Civic is <span className="font-bold">NOT</span> an emergency service. Always call <span className="font-bold">999</span> first if you are in immediate danger.
          </p>
        </div>
      </div>
    </div>
  )
}
