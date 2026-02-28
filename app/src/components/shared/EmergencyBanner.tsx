'use client'

export function EmergencyBanner() {
  return (
    <div className="bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-300 rounded-xl p-3 my-3">
      <p className="text-xs font-bold text-red-700 mb-0.5">⚠️ Always call 999 in an emergency</p>
      <p className="text-[11px] text-red-600/80">
        E-SAF Civic is a supplementary safety tool. It is NOT a replacement for emergency services.
      </p>
    </div>
  )
}
