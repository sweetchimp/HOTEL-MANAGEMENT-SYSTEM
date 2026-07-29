import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { Setting } from '../types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [settingDefs, setSettingDefs] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    const res = await api.get<Setting[]>('/settings')
    if (res.success && res.data) {
      setSettingDefs(res.data)
      const map: Record<string, string> = {}
      res.data.forEach(s => { map[s.setting_key] = s.setting_value })
      setSettings(map)
    } else {
      setError(res.error || 'Failed to load settings')
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await api.put('/settings', { settings })
    if (res.success) {
      setSuccess('Settings saved successfully')
      loadSettings()
    } else {
      setError(res.error || 'Failed to save settings')
    }
    setSaving(false)
  }

  const categorized = [
    { label: 'Hotel Information', keys: ['hotel_name', 'hotel_address', 'hotel_phone', 'hotel_email'] },
    { label: 'Financial', keys: ['tax_rate', 'currency'] },
    { label: 'Operations', keys: ['check_in_time', 'check_out_time', 'max_guests_per_booking'] },
    { label: 'Policies', keys: ['cancellation_policy'] },
  ]

  if (loading) return <p className="text-center py-8 text-surface-400">Loading...</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Settings</h1>
          <p className="text-surface-500 mt-1">Manage hotel system configuration.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
      )}

      {categorized.map(cat => (
        <div key={cat.label} className="card mt-6">
          <h2 className="text-lg font-semibold mb-4">{cat.label}</h2>
          <div className="space-y-4">
            {cat.keys.map(key => {
              const def = settingDefs.find(s => s.setting_key === key)
              if (!def) return null
              return (
                <div key={key}>
                  <label className="block text-sm font-medium text-surface-600 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    className="input-field"
                    value={settings[key] || ''}
                    onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                  />
                  {def.description && (
                    <p className="text-xs text-surface-400 mt-1">{def.description}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
