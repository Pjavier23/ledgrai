'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Client {
  id: string
  business_name: string
  industry: string
  status: string
  monthly_fee: number
  email?: string
  created_at: string
}

const INDUSTRIES = ['Cleaning', 'Construction', 'HVAC', 'Flooring', 'Landscaping', 'Plumbing', 'Electrical', 'Other']

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ business_name: '', industry: 'Cleaning', email: '' })
  const [saving, setSaving] = useState(false)

  const fetchClients = async () => {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data.clients || [])
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  const addClient = async () => {
    if (!form.business_name.trim()) return
    setSaving(true)
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, monthly_fee: 100, status: 'active' }),
    })
    setSaving(false)
    setShowModal(false)
    setForm({ business_name: '', industry: 'Cleaning', email: '' })
    fetchClients()
  }

  const mrr = clients.filter(c => c.status === 'active').length * 100
  const activeCount = clients.filter(c => c.status === 'active').length

  const statusColor = (s: string) => ({
    active: '#00b4d8',
    inactive: '#6b7280',
    pending: '#f59e0b',
  }[s] || '#6b7280')

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#222', background: '#0d0d0d' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00b4d8' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16v4H4V4zM4 10h10v4H4v-4zM4 16h7v4H4v-4z" fill="#000" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">LedgrAI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Pedro Javier</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black" style={{ background: '#00b4d8' }}>P</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Monthly Recurring Revenue', value: `$${mrr.toLocaleString()}`, sub: 'MRR' },
            { label: 'Active Clients', value: activeCount, sub: 'clients' },
            { label: 'Total Clients', value: clients.length, sub: 'all time' },
            { label: 'Monthly Fee', value: '$100', sub: 'per client' },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">{s.label}</div>
              <div className="text-3xl font-bold text-white">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: '#00b4d8' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Clients Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Clients</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
            style={{ background: '#00b4d8', color: '#000', fontWeight: 600, padding: '8px 18px', borderRadius: '8px' }}
          >
            + Add Client
          </button>
        </div>

        {/* Client Grid */}
        {loading ? (
          <div className="text-gray-400 text-center py-16">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <div className="text-gray-400">No clients yet. Add your first client to get started.</div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {clients.map((client) => (
              <Link href={`/dashboard/${client.id}`} key={client.id}>
                <div className="card p-5 hover:border-cyan-500 transition-colors cursor-pointer" style={{ borderColor: '#222' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-black" style={{ background: '#00b4d8' }}>
                      {client.business_name[0]}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: statusColor(client.status) + '22', color: statusColor(client.status) }}>
                      {client.status}
                    </span>
                  </div>
                  <div className="font-semibold text-white mb-1">{client.business_name}</div>
                  <div className="text-gray-400 text-sm mb-3">{client.industry}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: '#00b4d8' }}>${client.monthly_fee || 100}/mo</span>
                    <span className="text-gray-500 text-xs">{new Date(client.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-5">Add New Client</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Business Name *</label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={e => setForm({ ...form, business_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm"
                  style={{ background: '#1a1a1a', border: '1px solid #333' }}
                  placeholder="e.g. ABC Cleaning Co."
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
                <label className="text-sm text-gray-400 block mb-1">Client Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm"
                  style={{ background: '#1a1a1a', border: '1px solid #333' }}
                  placeholder="client@business.com"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1" style={{ border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px', background: 'transparent' }}>
                Cancel
              </button>
              <button onClick={addClient} disabled={saving} className="flex-1 font-semibold py-2 rounded-lg" style={{ background: '#00b4d8', color: '#000' }}>
                {saving ? 'Adding...' : 'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
