'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'

interface RegistrationData {
  fullName: string
  address: string
  email: string
  phone: string
  emergencyContactName: string
  emergencyContactPhone: string
  password: string
  confirmPassword: string
}

interface FieldErrors {
  fullName?: string
  address?: string
  email?: string
  phone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  password?: string
  confirmPassword?: string
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < step ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        />
      ))}
      <span className="text-xs text-slate-400 font-medium ml-1 whitespace-nowrap">
        Step {step} of {total}
      </span>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<RegistrationData>({
    fullName: '',
    address: '',
    email: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (field: keyof RegistrationData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: FieldErrors = {}

    if (!form.fullName.trim()) newErrors.fullName = 'Full legal name is required'
    if (!form.address.trim()) newErrors.address = 'Home address is required'

    if (!form.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Mobile number is required'
    } else if (!/^[\d\s+()-]{10,15}$/.test(form.phone.trim())) {
      newErrors.phone = 'Please enter a valid UK mobile number'
    }

    if (!form.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required'

    if (!form.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact number is required'
    } else if (!/^[\d\s+()-]{10,15}$/.test(form.emergencyContactPhone.trim())) {
      newErrors.emergencyContactPhone = 'Please enter a valid phone number'
    }

    if (!form.password) {
      newErrors.password = 'Password is required'
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    if (!validate()) return

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          address: form.address.trim(),
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Store registration data for later steps
      try {
        sessionStorage.setItem('esaf_reg_uid', data.user.id)
        sessionStorage.setItem('esaf_reg_email', form.email.trim())
        sessionStorage.setItem('esaf_reg_password', form.password)
      } catch {
        // Ignore storage errors
      }

      router.push('/register/verify')
    } catch {
      setServerError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 via-blue-700 to-blue-800 rounded-b-[2rem] px-5 pt-12 pb-10 text-center relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[24px] font-extrabold text-white">Create Account</h1>
        <p className="text-blue-100 text-[14px] mt-1">Let&apos;s get you set up</p>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        <ProgressBar step={1} total={5} />

        {serverError && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 mb-4 animate-fade-in">
            <p className="text-xs text-red-700 font-medium">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleContinue} className="space-y-4">
          <Input
            label="Full Legal Name"
            placeholder="John Smith"
            value={form.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            error={errors.fullName}
            autoComplete="name"
          />

          <Input
            label="Home Address"
            placeholder="123 High Street, London"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            error={errors.address}
            autoComplete="street-address"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Mobile Number"
            type="tel"
            placeholder="07700 900000"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            error={errors.phone}
            autoComplete="tel"
          />

          <Input
            label="Emergency Contact Name"
            placeholder="Jane Smith"
            value={form.emergencyContactName}
            onChange={(e) => updateField('emergencyContactName', e.target.value)}
            error={errors.emergencyContactName}
          />

          <Input
            label="Emergency Contact Number"
            type="tel"
            placeholder="07700 900001"
            value={form.emergencyContactPhone}
            onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
            error={errors.emergencyContactPhone}
          />

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3 font-medium">Secure your account</p>
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <div className="pt-3">
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
