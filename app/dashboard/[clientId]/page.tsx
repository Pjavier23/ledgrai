'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  business_name: string
  industry: string
  status: string
  monthly_fee: number
  email?: string
}

interface Document {
  id: string
  file_name: string
  file_url: string
  vendor?: string
  amount?: number
  doc_date?: string
  category?: string
  description?: string
  is_income?: boolean
  extracted?: boolean
  created_at: string
}

interface TaxEvent {
  id: string
  quarter: string
  due_date: string
  completed: boolean
  description?: string
}

const TABS = ['Overview', 'Documents', 'Tax Dates', 'Reports']

const TAX_QUARTERS = [
  { q: 'Q1', label: 'Q1 (Jan–Mar)', due: 'Apr 15' },
  { q: 'Q2', label: 'Q2 (Apr–Jun)', due: 'Jun 15' },
  { q: 'Q3', label: 'Q3 (Jul–Sep)', due: 'Sep 15' },
  { q: 'Q4', label: 'Q4 (Oct–Dec)', due: 'Jan 15' },
]

export default function ClientDetailPage() {
  const { clientId } = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('Overview')
  const [client, setClient] = useState<Client | null>(null)
  const [docs, setDocs] = useState<Document[]>([])
  const [taxEvents, setTaxEvents] = useState<TaxEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchAll = async () => {
    const [cRes, dRes] = await Promise.all([
      fetch('/api/clients'),
      fetch(`/api/documents?client_id=${clientId}`),
    ])
    const cData = await cRes.json()
    const dData = await dRes.json()
    const found = (cData.clients || []).find((c: Client) => c.id === clientId)
    setClient(found || null)
    setDocs(dData.documents || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [clientId])

  const totalIncome = docs.filter(d => d.is_income).reduce((s, d) => s + (d.amount || 0), 0)
  const totalExpenses = docs.filter(d => !d.is_income && d.amount).reduce((s, d) => s + (d.amount || 0), 0)
  const netPL = totalIncome - totalExpenses

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('client_id', clientId as string)
    await fetch('/api/documents', { method: 'POST', body: formData })
    setUploading(false)
    fetchAll()
  }

  const categoryBreakdown = docs
    .filter(d => !d.is_income && d.category)
    .reduce((acc: Record<string, number>, d) => {
      acc[d.category!] = (acc[d.category!] || 0) + (d.amount || 0)
      return acc
    }, {})

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}><div className="text-gray-400">Loading...</div></div>
  if (!client) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}><div className="text-gray-400">Client not found</div></div>

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#222', background: '#0d0d0d' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">{client.business_name}</span>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#00b4d822', color: '#00b4d8' }}>{client.status}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Client Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-black" style={{ background: '#00b4d8' }}>
            {client.business_name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.business_name}</h1>
            <div className="text-gray-400">{client.industry} · {client.email || 'No email'}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: '#222' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: activeTab === tab ? '#00b4d8' : '#9ca3af',
                borderBottom: activeTab === tab ? '2px solid #00b4d8' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'Overview' && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="card p-5">
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Income</div>
                <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="card p-5">
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Expenses</div>
                <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="card p-5">
                <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Net P&L</div>
                <div className="text-2xl font-bold" style={{ color: netPL >= 0 ? '#22c55e' : '#ef4444' }}>
                  {netPL >= 0 ? '+' : ''} ${netPL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <h3 className="text-white font-semibold mb-3">Recent Documents</h3>
            {docs.length === 0 ? (
              <div className="card p-8 text-center text-gray-400">No documents yet. Upload receipts or invoices in the Documents tab.</div>
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#222' }}>
                      {['File', 'Vendor', 'Amount', 'Date', 'Category', 'Type'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-400 uppercase tracking-wide px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {docs.slice(0, 5).map(doc => (
                      <tr key={doc.id} className="border-b" style={{ borderColor: '#1a1a1a' }}>
                        <td className="px-4 py-3 text-sm text-white">{doc.file_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{doc.vendor || '—'}</td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: doc.is_income ? '#22c55e' : '#ef4444' }}>
                          {doc.amount ? `$${doc.amount.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{doc.doc_date || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{doc.category || '—'}</td>
                        <td className="px-4 py-3 text-xs px-2 py-1 rounded-full inline-block" style={{ background: doc.is_income ? '#22c55e22' : '#ef444422', color: doc.is_income ? '#22c55e' : '#ef4444' }}>
                          {doc.is_income ? 'Income' : 'Expense'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Documents */}
        {activeTab === 'Documents' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Documents ({docs.length})</h3>
              <div>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="font-semibold px-4 py-2 rounded-lg text-sm"
                  style={{ background: '#00b4d8', color: '#000' }}
                >
                  {uploading ? '⏳ Uploading...' : '📷 Upload Document'}
                </button>
              </div>
            </div>

            {docs.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-4xl mb-3">📄</div>
                <div className="text-gray-400 mb-4">No documents yet</div>
                <button onClick={() => fileRef.current?.click()} className="btn-primary text-sm" style={{ background: '#00b4d8', color: '#000', padding: '8px 18px', borderRadius: '8px', fontWeight: 600 }}>
                  Upload First Document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {docs.map(doc => (
                  <div key={doc.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">{doc.is_income ? '💰' : '🧾'}</div>
                      {doc.extracted && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#00b4d822', color: '#00b4d8' }}>AI Extracted</span>}
                    </div>
                    <div className="font-medium text-white text-sm mb-2 truncate">{doc.file_name}</div>
                    {doc.vendor && <div className="text-gray-400 text-xs mb-1">Vendor: <span className="text-gray-200">{doc.vendor}</span></div>}
                    {doc.amount && <div className="text-gray-400 text-xs mb-1">Amount: <span className="font-semibold" style={{ color: doc.is_income ? '#22c55e' : '#ef4444' }}>${doc.amount.toFixed(2)}</span></div>}
                    {doc.doc_date && <div className="text-gray-400 text-xs mb-1">Date: <span className="text-gray-200">{doc.doc_date}</span></div>}
                    {doc.category && <div className="text-gray-400 text-xs">Category: <span className="text-gray-200">{doc.category}</span></div>}
                    {!doc.extracted && <div className="text-gray-500 text-xs mt-2 italic">Processing...</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Tax Dates */}
        {activeTab === 'Tax Dates' && (
          <div>
            <h3 className="text-white font-semibold mb-5">Quarterly Tax Deadlines</h3>
            <div className="space-y-3">
              {TAX_QUARTERS.map(q => (
                <div key={q.q} className="card p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: '#1a1a1a', color: '#00b4d8', border: '1px solid #333' }}>
                      {q.q}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{q.label}</div>
                      <div className="text-gray-400 text-sm">Due: {q.due}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#f59e0b22', color: '#f59e0b' }}>Upcoming</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-4 mt-4" style={{ borderColor: '#1a3a4a', background: '#0a1a22' }}>
              <div className="text-xs text-gray-400">💡 <span className="text-gray-300">Quarterly estimated taxes are due 15 days after each quarter ends. Mark as complete when filed.</span></div>
            </div>
          </div>
        )}

        {/* Tab: Reports */}
        {activeTab === 'Reports' && (
          <div>
            <h3 className="text-white font-semibold mb-5">P&L Report</h3>

            {/* P&L Table */}
            <div className="card overflow-hidden mb-6">
              <div className="px-5 py-3 border-b" style={{ borderColor: '#222' }}>
                <span className="text-sm font-semibold text-white">Profit & Loss Summary</span>
              </div>
              <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-gray-400">Total Income</span>
                  <span className="font-semibold" style={{ color: '#22c55e' }}>${totalIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-gray-400">Total Expenses</span>
                  <span className="font-semibold" style={{ color: '#ef4444' }}>(${totalExpenses.toFixed(2)})</span>
                </div>
                <div className="flex justify-between px-5 py-3 font-bold">
                  <span className="text-white">Net Profit / Loss</span>
                  <span style={{ color: netPL >= 0 ? '#22c55e' : '#ef4444' }}>${netPL.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <h3 className="text-white font-semibold mb-3">Expense Categories</h3>
            <div className="card overflow-hidden">
              {Object.keys(categoryBreakdown).length === 0 ? (
                <div className="p-8 text-center text-gray-400">No expense data yet</div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#1a1a1a' }}>
                  {Object.entries(categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amt]) => (
                      <div key={cat} className="flex items-center justify-between px-5 py-3">
                        <span className="text-gray-300 capitalize">{cat}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 rounded-full" style={{ background: '#222' }}>
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${Math.min(100, (amt / totalExpenses) * 100)}%`, background: '#00b4d8' }}
                            />
                          </div>
                          <span className="text-gray-300 w-20 text-right font-medium">${amt.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
