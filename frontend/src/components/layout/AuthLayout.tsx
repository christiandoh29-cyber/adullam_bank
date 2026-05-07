// src/components/layout/AuthLayout.tsx
import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-card-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* Purple glow */}
        <div className="absolute inset-0 bg-purple-glow pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-20 w-80 h-80 rounded-full bg-accent-purple/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Adullam Bank</span>
          </Link>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Banking for<br />
            <span className="text-transparent bg-clip-text bg-brand-gradient">the future.</span>
          </h1>
          <p className="text-surface-300 text-base leading-relaxed max-w-sm">
            Secure, fast, and designed for Africa. Transfer money, manage your cards, and track your finances — all in one place.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3">
            {[
              'Virtual VISA & Mastercard',
              'Instant transfers via IBAN',
              'Real-time balance tracking',
              'Bank-grade encryption',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-surface-200 text-sm">
                <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-400 text-xs">✓</span>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative card mock */}
        <div className="relative z-10 opacity-30">
          <p className="text-surface-500 text-xs">© {new Date().getFullYear()} Adullam Bank. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3 justify-center">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-white font-bold text-lg">Adullam Bank</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
