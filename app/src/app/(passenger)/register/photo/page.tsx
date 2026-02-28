'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/shared/Button'
import { ensureSignedIn } from '@/lib/auth/ensure-signed-in'
import { uploadProfilePhoto } from '@/lib/firebase/storage-upload'

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

export default function PhotoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target?.result as string)
    }
    reader.readAsDataURL(selected)
  }

  const handleContinue = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const uid = await ensureSignedIn()
      if (!uid) {
        setError('Unable to authenticate. Please try again.')
        setUploading(false)
        return
      }

      const { promise } = uploadProfilePhoto(uid, file, setUploadProgress)
      const downloadUrl = await promise

      const idToken = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken()
      await fetch(`/api/users/${uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ photoUrl: downloadUrl }),
      })

      router.push('/register/safety-zone')
    } catch {
      setError('Upload failed. Please try again.')
      setUploading(false)
    }
  }

  const handleSkip = () => {
    router.push('/register/safety-zone')
  }

  const handleRetake = () => {
    setPreview(null)
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
        <h1 className="text-[24px] font-extrabold text-white">Profile Photo</h1>
        <p className="text-blue-100 text-[14px] mt-1">Help operators identify you</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-6 pb-[100px]">
        <ProgressBar step={4} total={5} />

        <div className="text-center">
          {/* Photo Circle */}
          <div className="mb-6 flex justify-center">
            <div className="w-[100px] h-[100px] rounded-full border-[3px] border-blue-500 bg-slate-100 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-red-600 font-medium mb-4">{error}</p>
          )}

          {!preview ? (
            <>
              <p className="text-[14px] text-slate-600 mb-6 leading-relaxed max-w-xs mx-auto">
                Take a clear, front-facing selfie. This photo is shared with the control room during <span className="font-semibold text-red-600">Red alerts only</span>.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="hidden"
              />

              <Button fullWidth size="lg" onClick={handleCapture}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Take Selfie
              </Button>
            </>
          ) : uploading ? (
            <div className="space-y-4">
              <p className="text-[14px] text-blue-700 font-semibold">Uploading photo...</p>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{Math.round(uploadProgress)}%</p>
            </div>
          ) : (
            <>
              <p className="text-[14px] text-green-700 font-semibold mb-6">
                Photo captured successfully
              </p>

              <div className="space-y-3">
                <Button fullWidth size="lg" onClick={handleContinue}>
                  Continue
                </Button>

                <Button fullWidth size="md" variant="secondary" onClick={handleRetake}>
                  Retake Photo
                </Button>
              </div>
            </>
          )}

          {!preview && (
            <button
              onClick={handleSkip}
              className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip for now
            </button>
          )}

          <div className="mt-8 bg-slate-100 rounded-xl p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold">Blue alerts</span> are anonymous &mdash; your photo is not shared.{' '}
              <span className="font-semibold">Red alerts</span> share your name, age, and photo with the control room to help operators identify you on CCTV.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
