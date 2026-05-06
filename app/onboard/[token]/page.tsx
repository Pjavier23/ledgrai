'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

const INDUSTRIES = ['Cleaning', 'Construction', 'HVAC', 'Flooring', 'Landscaping', 'Plumbing', 'Electrical', 'Other']

export default function OnboardPage() {
  const { token } = useParams()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    business_name: '',
    industry: 'Cleaning',
    email: '',
    phone: '',
    owner_name: '',
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!form.business_name || !form.email) return
    setSaving(true)
    // In production, verify token and update client record
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monthly_fee: 100, status: 'active', onboard_token: token }),
    })
    setSaving(false)
    setStep(3)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00b4d8' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v4H4V4zM4 10h10v4H4v-4zM4 16h7v4H4v-4z" fill="#000" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">LedgrAI</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: step >= s ? '#00b4d8' : '#222',
                  color: step >= s ? '#000' : '#666',
                }}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className="w-12 h-px" style={{ background: step > s ? '#00b4d8' : '#333' }} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Business Information</h2>
              <p className="text-gray-400 text-sm mb-6">Tell us about your business so we can set up your books.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={e => setForm({ ...form, business_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: '#1a1a1a', border: '1px solid #333' }}
                    placeholder="ABC Cleaning Co."
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={form.owner_name}
                    onChange={e => setForm({ ...form, owner_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: '#1a1a1a', border: '1px solid #333' }}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Industry</label>
                  <select
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: '#1a1a1a', border: '1px solid #333' }}
                  >
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: '#1a1a1a', border: '1px solid #333' }}
                    placeholder="you@business.com"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm"
                    style={{ background: '#1a1a1a', border: '1px solid #333' }}
                    placeholder="(555) 000-0000"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (form.business_name && form.email) setStep(2)
                }}
                className="w-full mt-6 py-3 rounded-xl font-semibold"
                style={{ background: '#00b4d8', color: '#000' }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Bank Connection</h2>
              <p className="text-gray-400 text-sm mb-6">Connect your bank for automatic transaction imports.</p>
              <div className="card p-6 text-center" style={{ background: '#1a1a1a', border: '1px dashed #333' }}>
                <div className="text-4xl mb-3">🏦</div>
                <div className="font-semibold text-white mb-1">Coming Soon</div>
                <div className="text-gray-400 text-sm">Bank integration via Plaid is under development. For now, upload documents manually.</div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-medium" style={{ border: '1px solid #333', color: '#fff', background: 'transparent' }}>
                  ← Back
                </button>
                <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-xl font-semibold" style={{ background: '#00b4d8', color: '#000' }}>
                  {saving ? 'Saving...' : 'Finish Setup →'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-white mb-2">You're all set!</h2>
              <p className="text-gray-400 mb-6">
                Your bookkeeper will review your info and reach out within 24 hours. You'll receive email confirmations for all documents and reports.
              </p>
              <div className="card p-4 text-left mb-6" style={{ background: '#0a1a22', borderColor: '#1a3a4a' }}>
                <div className="text-sm text-gray-400 mb-1">What happens next:</div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ Your books are being set up</li>
                  <li>✓ Upload receipts via your dashboard link</li>
                  <li>✓ Monthly P&L reports via email</li>
                  <li>⏳ Quarterly tax reminders auto-scheduled</li>
                </ul>
              </div>
              <div className="text-gray-500 text-sm">Questions? Email your bookkeeper.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
