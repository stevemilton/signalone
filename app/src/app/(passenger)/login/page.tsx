'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import type { User } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setFirebaseUid } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const idToken = await credential.user.getIdToken()

      setFirebaseUid(credential.user.uid)

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      const user = data.user as User
      setUser(user)

      // Store returning user info for quick login
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
        // Ignore storage errors
      }

      router.push('/alert')
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string }
      if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential') {
        setError('Invalid email or password')
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else {
        setError('An error occurred. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-12 pb-10 text-center">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[24px] font-extrabold text-white">Sign In</h1>
        <p className="text-blue-100 text-[14px] mt-1">Welcome back to E-SAF Civic</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-8 pb-[100px]">
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 animate-fade-in">
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
          >
            Forgot Password?
          </button>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => router.push('/register')}
              className="text-blue-600 font-semibold hover:text-blue-800"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
