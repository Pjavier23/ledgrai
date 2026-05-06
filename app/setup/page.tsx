'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SetupStatus {
  tables: Record<string, boolean>
  allTablesExist: boolean
  bucket: { exists: boolean; created: boolean }
  setupSql: string
  supabaseUrl: string
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/setup')
      const data = await res.json()
      setStatus(data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { checkStatus() }, [])

  const copySQL = () => {
    if (status?.setupSql) {
      navigator.clipboard.writeText(status.setupSql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: '#222', background: '#0d0d0d' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-gray-600">/</span>
            <span className="text-white font-semibold">Database Setup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00b4d8' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16v4H4V4zM4 10h10v4H4v-4zM4 16h7v4H4v-4z" fill="#000" />
              </svg>
            </div>
            <span className="text-white font-bold">LedgrAI</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Database Setup</h1>
          <p className="text-gray-400">Check the status of your Supabase tables and initialize if needed.</p>
        </div>

        {loading ? (
          <div className="card p-12 text-center text-gray-400">Checking database status...</div>
        ) : status ? (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(status.tables).map(([table, exists]) => (
                <div key={table} className="card p-5 flex items-center gap-4">
                  <div className="text-2xl">{exists ? '✅' : '❌'}</div>
                  <div>
                    <div className="font-semibold text-white font-mono text-sm">{table}</div>
                    <div className="text-xs mt-0.5" style={{ color: exists ? '#22c55e' : '#ef4444' }}>
                      {exists ? 'Table exists' : 'Table missing'}
                    </div>
                  </div>
                </div>
              ))}
              <div className="card p-5 flex items-center gap-4">
                <div className="text-2xl">{status.bucket.exists ? '✅' : '❌'}</div>
                <div>
                  <div className="font-semibold text-white font-mono text-sm">bk-documents</div>
                  <div className="text-xs mt-0.5" style={{ color: status.bucket.exists ? '#22c55e' : '#ef4444' }}>
                    {status.bucket.exists
                      ? status.bucket.created
                        ? 'Storage bucket created ✨'
                        : 'Storage bucket exists'
                      : 'Storage bucket missing'}
                  </div>
                </div>
              </div>
            </div>

            {status.allTablesExist ? (
              <div className="card p-6 text-center" style={{ borderColor: '#22c55e33', background: '#0a1a0a' }}>
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-xl font-bold text-white mb-2">Database is ready!</h2>
                <p className="text-gray-400 mb-4">All tables exist. Your app is fully operational.</p>
                <Link
                  href="/dashboard"
                  className="inline-block font-semibold px-6 py-3 rounded-lg text-black"
                  style={{ background: '#00b4d8' }}
                >
                  Go to Dashboard →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card p-6" style={{ borderColor: '#f59e0b33', background: '#1a1000' }}>
                  <h2 className="text-lg font-bold text-white mb-2">⚠️ Action Required</h2>
                  <p className="text-gray-400 mb-4">
                    One or more database tables are missing. Run the SQL below in your Supabase SQL Editor to create them.
                  </p>
                  <a
                    href={status.supabaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-semibold px-4 py-2 rounded-lg text-sm"
                    style={{ background: '#3ecf8e', color: '#000' }}
                  >
                    Open Supabase SQL Editor ↗
                  </a>
                </div>

                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: '#222' }}>
                    <span className="text-sm font-semibold text-white">Setup SQL</span>
                    <button
                      onClick={copySQL}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                      style={{ background: copied ? '#22c55e22' : '#1a1a1a', color: copied ? '#22c55e' : '#9ca3af', border: '1px solid #333' }}
                    >
                      {copied ? '✓ Copied!' : '📋 Copy SQL'}
                    </button>
                  </div>
                  <pre
                    className="p-5 text-xs overflow-auto"
                    style={{
                      background: '#0d0d0d',
                      color: '#e2e8f0',
                      maxHeight: '400px',
                      fontFamily: 'ui-monospace, monospace',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {status.setupSql}
                  </pre>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={checkStatus}
                    className="flex-1 font-semibold py-3 rounded-lg"
                    style={{ background: '#00b4d8', color: '#000' }}
                  >
                    🔄 Check Again
                  </button>
                  <Link
                    href="/dashboard"
                    className="flex-1 font-semibold py-3 rounded-lg text-center"
                    style={{ border: '1px solid #333', color: '#fff' }}
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="text-gray-400 mb-4">Failed to fetch setup status.</div>
            <button onClick={checkStatus} className="font-semibold px-4 py-2 rounded-lg text-sm" style={{ background: '#00b4d8', color: '#000' }}>
              Retry
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
