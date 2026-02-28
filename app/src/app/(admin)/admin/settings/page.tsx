'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Card } from '@/components/shared/Card'
import type { SanctionLevel } from '@/types'

interface SystemSettings {
  general: {
    appName: string
    supportEmail: string
    defaultAlertDuration: number
  }
  alerts: {
    maxAlertsPerDay: number
    holdDuration: number
    monitoringTimer: number
  }
  sanctions: {
    levels: {
      level: SanctionLevel
      label: string
      durationDays: number | null
    }[]
  }
  sms: {
    provider: string
    apiKey: string
    phoneNumber: string
  }
}

const defaultSettings: SystemSettings = {
  general: {
    appName: 'E-SAF Civic',
    supportEmail: 'support@esaf.uk',
    defaultAlertDuration: 1800,
  },
  alerts: {
    maxAlertsPerDay: 2,
    holdDuration: 3,
    monitoringTimer: 30,
  },
  sanctions: {
    levels: [
      { level: 'none', label: 'None', durationDays: null },
      { level: 'warning_1', label: 'Warning 1', durationDays: null },
      { level: 'warning_2', label: 'Warning 2', durationDays: null },
      { level: 'restricted', label: 'Restricted (1/week)', durationDays: 180 },
      { level: 'banned_3m', label: 'Banned 3 Months', durationDays: 90 },
      { level: 'banned_permanent', label: 'Permanent Ban', durationDays: null },
    ],
  },
  sms: {
    provider: 'Twilio',
    apiKey: '',
    phoneNumber: '',
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      const data = await res.json()
      setSettings({
        general: { ...defaultSettings.general, ...data.general },
        alerts: { ...defaultSettings.alerts, ...data.alerts },
        sanctions: data.sanctions?.levels ? data.sanctions : defaultSettings.sanctions,
        sms: { ...defaultSettings.sms, ...data.sms },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    if (!settings.general.appName.trim()) {
      setError('App name is required')
      setSaving(false)
      return
    }
    if (!settings.general.supportEmail.trim()) {
      setError('Support email is required')
      setSaving(false)
      return
    }
    if (settings.alerts.maxAlertsPerDay < 1) {
      setError('Max alerts per day must be at least 1')
      setSaving(false)
      return
    }
    if (settings.alerts.holdDuration < 1) {
      setError('Hold duration must be at least 1 second')
      setSaving(false)
      return
    }
    if (settings.alerts.monitoringTimer < 1) {
      setError('Monitoring timer must be at least 1 minute')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      setSuccess('Settings saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateGeneral = (field: keyof SystemSettings['general'], value: string | number) => {
    setSettings({ ...settings, general: { ...settings.general, [field]: value } })
  }

  const updateAlerts = (field: keyof SystemSettings['alerts'], value: number) => {
    setSettings({ ...settings, alerts: { ...settings.alerts, [field]: value } })
  }

  const updateSanctionDuration = (index: number, days: number | null) => {
    const levels = [...settings.sanctions.levels]
    levels[index] = { ...levels[index], durationDays: days }
    setSettings({ ...settings, sanctions: { levels } })
  }

  const updateSanctionLabel = (index: number, label: string) => {
    const levels = [...settings.sanctions.levels]
    levels[index] = { ...levels[index], label }
    setSettings({ ...settings, sanctions: { levels } })
  }

  const updateSms = (field: keyof SystemSettings['sms'], value: string) => {
    setSettings({ ...settings, sms: { ...settings.sms, [field]: value } })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-gray-100 rounded" />
                <div className="h-10 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          Save Settings
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
          <div className="space-y-4">
            <Input
              label="Application Name"
              value={settings.general.appName}
              onChange={(e) => updateGeneral('appName', e.target.value)}
            />
            <Input
              label="Support Email"
              type="email"
              value={settings.general.supportEmail}
              onChange={(e) => updateGeneral('supportEmail', e.target.value)}
            />
            <Input
              label="Default Alert Duration (seconds)"
              type="number"
              value={String(settings.general.defaultAlertDuration)}
              onChange={(e) => updateGeneral('defaultAlertDuration', Number(e.target.value))}
              hint="Duration in seconds (e.g., 1800 = 30 minutes)"
            />
          </div>
        </Card>

        {/* Alert Configuration */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Configuration</h2>
          <div className="space-y-4">
            <Input
              label="Max Alerts per 24 Hours"
              type="number"
              value={String(settings.alerts.maxAlertsPerDay)}
              onChange={(e) => updateAlerts('maxAlertsPerDay', Number(e.target.value))}
              hint="Maximum number of alerts a user can raise per day"
            />
            <Input
              label="Hold Duration (seconds)"
              type="number"
              value={String(settings.alerts.holdDuration)}
              onChange={(e) => updateAlerts('holdDuration', Number(e.target.value))}
              hint="How long the user must hold the alert button"
            />
            <Input
              label="Monitoring Timer (minutes)"
              type="number"
              value={String(settings.alerts.monitoringTimer)}
              onChange={(e) => updateAlerts('monitoringTimer', Number(e.target.value))}
              hint="Default monitoring duration after visual confirmation"
            />
          </div>
        </Card>

        {/* Sanction Configuration */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sanction Configuration</h2>
          <div className="space-y-3">
            {settings.sanctions.levels.map((sanction, index) => (
              <div key={sanction.level} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <Input
                    value={sanction.label}
                    onChange={(e) => updateSanctionLabel(index, e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="w-32">
                  {sanction.level !== 'none' && sanction.level !== 'warning_1' && sanction.level !== 'warning_2' && sanction.level !== 'banned_permanent' ? (
                    <Input
                      type="number"
                      placeholder="Days"
                      value={sanction.durationDays !== null ? String(sanction.durationDays) : ''}
                      onChange={(e) => updateSanctionDuration(index, e.target.value ? Number(e.target.value) : null)}
                      hint="days"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 block text-center">
                      {sanction.level === 'banned_permanent' ? 'Permanent' : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SMS Configuration */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SMS Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Provider</label>
              <select
                value={settings.sms.provider}
                onChange={(e) => updateSms('provider', e.target.value)}
                className="w-full px-3.5 py-3 text-sm border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="Twilio">Twilio</option>
                <option value="Vonage">Vonage</option>
                <option value="MessageBird">MessageBird</option>
              </select>
            </div>
            <Input
              label="API Key"
              type="password"
              placeholder="Enter API key..."
              value={settings.sms.apiKey}
              onChange={(e) => updateSms('apiKey', e.target.value)}
              hint="Your SMS provider API key"
            />
            <Input
              label="Phone Number"
              placeholder="+44..."
              value={settings.sms.phoneNumber}
              onChange={(e) => updateSms('phoneNumber', e.target.value)}
              hint="The sender phone number for SMS notifications"
            />
          </div>
        </Card>
      </div>

      {/* Bottom Save */}
      <div className="flex justify-end pt-4">
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
