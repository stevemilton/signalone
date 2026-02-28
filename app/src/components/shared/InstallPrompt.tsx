'use client'

import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'signal_one_install_dismissed'
const DISMISS_DAYS = 7

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Don't show if recently dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setVisible(false)
    setDeferredPrompt(null)
  }, [])

  // Escape key handler
  useEffect(() => {
    if (!visible) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, handleDismiss])

  if (!visible) return null

  return (
    <div role="dialog" aria-label="Install Signal One" className="fixed bottom-4 left-4 right-4 max-w-[398px] mx-auto z-40 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
        <span className="text-white text-sm font-bold">S1</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">Add Signal One to your home screen</p>
        <p className="text-xs text-slate-500 mt-0.5">Quick access when you need it most</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-800 active:bg-blue-900 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-300 focus-visible:outline-none"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-slate-500 text-xs font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:outline-none"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
