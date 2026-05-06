import Link from 'next/link'

export default function LandingPage() {
  

  return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="text-center max-w-2xl px-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#00b4d8' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v4H4V4zM4 10h10v4H4v-4zM4 16h7v4H4v-4z" fill="#000" />
            </svg>
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">LedgrAI</span>
        </div>

        {/* Tagline */}
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          Bookkeeping for<br />
          <span style={{ color: '#00b4d8' }}>small businesses</span>
        </h1>
        <p className="text-gray-400 text-xl mb-10">
          AI-powered receipt extraction, real-time P&L, and tax prep—all in one platform.
        </p>

        {/* CTA */}
        <Link href="/dashboard"
          
          className="btn-primary text-lg px-8 py-3 rounded-xl"
          style={{ background: '#00b4d8', color: '#000', fontWeight: 700, fontSize: '1.1rem' }}
        >
          Sign In →
        </Link>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mt-16">
          {[
            { icon: '📄', title: 'Receipt AI', desc: 'Upload docs and AI extracts vendor, amount, category instantly' },
            { icon: '📊', title: 'Live P&L', desc: 'Real-time income vs expenses dashboard for every client' },
            { icon: '📅', title: 'Tax Dates', desc: 'Automatic quarterly deadline tracking—never miss a filing' },
          ].map((f) => (
            <div key={f.title} className="card p-5 text-left">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-white mb-1">{f.title}</div>
              <div className="text-gray-400 text-sm">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
