'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { useAuthStore } from '@/stores/auth-store'
import type { User } from '@/types'

export default function ControlRoomLoginPage() {
  const router = useRouter()
  const { setUser, setFirebaseUid, setLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setSubmitting(true)

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const firebaseUser = credential.user

      setFirebaseUid(firebaseUser.uid)

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (!userDoc.exists()) {
        setError('User profile not found. Contact an administrator.')
        setSubmitting(false)
        return
      }

      const userData = { id: userDoc.id, ...userDoc.data() } as User

      // Validate role
      const allowedRoles = ['operator', 'supervisor', 'admin', 'control_room_manager']
      if (!allowedRoles.includes(userData.role)) {
        setError('Access denied. This login is for Control Room operators only.')
        await auth.signOut()
        setSubmitting(false)
        return
      }

      setUser(userData)
      setLoading(false)
      router.push('/control-room/dashboard')
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string }

      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        setError('Invalid email or password.')
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else if (firebaseError.code === 'auth/invalid-credential') {
        setError('Invalid email or password.')
      } else {
        setError('Authentication failed. Please try again.')
      }

      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0f1e' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
            <span className="text-white text-xl font-extrabold">S1</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-200">Control Room Access</h1>
          <p className="text-sm text-slate-400 mt-1">E-SAF Civic Operator Login</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="rounded-2xl p-6 border"
          style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@esaf.uk"
              autoComplete="email"
              className="w-full px-4 py-3 text-sm rounded-xl border bg-slate-900 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              style={{ borderColor: '#334155' }}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full px-4 py-3 text-sm rounded-xl border bg-slate-900 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              style={{ borderColor: '#334155' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Authorised personnel only. All sessions are logged.
        </p>
      </div>
    </div>
  )
}
