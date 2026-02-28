'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/shared/Button'
import type { User } from '@/types'

export default function LinkedPage() {
  const router = useRouter()
  const { setUser, setFirebaseUid } = useAuthStore()
  const [controlRoomName, setControlRoomName] = useState('Control Room')
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const name = sessionStorage.getItem('esaf_reg_control_room_name')
      const pc = sessionStorage.getItem('esaf_reg_postcode')
      if (name) setControlRoomName(name)
      if (pc) setPostcode(pc)
    } catch {
      // Ignore
    }
  }, [])

  const handleStart = async () => {
    setLoading(true)

    try {
      // Sign in with credentials stored during registration
      const email = sessionStorage.getItem('esaf_reg_email')
      const password = sessionStorage.getItem('esaf_reg_password')
      const controlRoomId = sessionStorage.getItem('esaf_reg_control_room_id')

      // Sign in only if not already signed in (photo/verify steps may have signed in early)
      const alreadySignedIn = !!auth.currentUser
      const user$ = alreadySignedIn
        ? auth.currentUser!
        : email && password
          ? (await signInWithEmailAndPassword(auth, email, password)).user
          : null

      if (user$) {
        const idToken = await user$.getIdToken()
        const credential = { user: user$ }

        setFirebaseUid(credential.user.uid)

        // Update user with safety zone and control room
        const updateRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })

        if (updateRes.ok) {
          const data = await updateRes.json()
          const user = data.user as User
          setUser(user)

          // Store returning user info
          try {
            localStorage.setItem(
              'esaf_returning_user',
              JSON.stringify({
                name: user.fullName,
                email: user.email,
                photoUrl: user.photoUrl,
              })
            )
          } catch {
            // Ignore
          }
        }
      }

      // Clean up session storage
      try {
        sessionStorage.removeItem('esaf_reg_email')
        sessionStorage.removeItem('esaf_reg_password')
        sessionStorage.removeItem('esaf_reg_uid')
        sessionStorage.removeItem('esaf_reg_postcode')
        sessionStorage.removeItem('esaf_reg_control_room_id')
        sessionStorage.removeItem('esaf_reg_control_room_name')
      } catch {
        // Ignore
      }

      router.push('/alert')
    } catch {
      // If auth fails, still redirect
      router.push('/alert')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-12 pb-10 text-center">
        <h1 className="text-[24px] font-extrabold text-white">You&apos;re Linked</h1>
        <p className="text-blue-100 text-[14px] mt-1">Registration complete</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-8 pb-[100px]">
        {/* Success Animation */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            You&apos;re linked to {controlRoomName}
          </h2>
          <p className="text-[14px] text-slate-500">Your safety zone is set up and ready</p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-8">
          <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Control Room</p>
                <p className="text-[14px] font-bold text-slate-900">{controlRoomName}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Operating Hours</p>
                <p className="text-[14px] font-bold text-slate-900">Mon-Sun, 07:00 - 23:00</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Coverage Area</p>
                <p className="text-[14px] font-bold text-slate-900">{postcode || 'Hertfordshire'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">CCTV Cameras</p>
                <p className="text-[14px] font-bold text-slate-900">48 cameras in your area</p>
              </div>
            </div>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleStart}
          loading={loading}
        >
          Start Using E-SAF Civic
        </Button>
      </div>
    </div>
  )
}
