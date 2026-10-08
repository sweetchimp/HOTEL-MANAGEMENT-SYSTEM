import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  'Room Management',
  'Guest Reservations',
  'Check-in / Check-out',
  'Billing & Invoicing',
  'Reports & Analytics',
]

export default function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-500 p-6">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-accent-500" />

      {/* Watermark */}
      <img
        src="/AH_Logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-20 h-[520px] w-[520px] object-contain opacity-[0.07] select-none"
      />
      <img
        src="/AH_Logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-28 h-96 w-96 rotate-12 object-contain opacity-[0.05] select-none"
      />

      <div className="relative w-full max-w-lg animate-slide-up text-center">
        {/* Brand */}
        <img
          src="/AH_Logo.png"
          alt="ALTONS Hotel logo"
          className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-white/95 object-contain p-1.5 shadow-lg ring-2 ring-accent-500/50"
        />
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
          ALTONS<span className="text-accent-400">HOTEL</span>
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.2em] text-primary-200">
          Management System
        </p>

        <div className="mx-auto mt-7 mb-7 h-1 w-20 bg-accent-500" />

        <p className="font-display text-xl font-semibold text-white sm:text-2xl">
          Welcome to your hotel management dashboard
        </p>
        <p className="mt-2 text-primary-200">
          Manage reservations, rooms, guests, and more.
        </p>

        {/* Features */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:p-6">
          <ul className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
            {FEATURES.map(feature => (
              <li
                key={feature}
                className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500">
                  <Check className="h-3 w-3 font-bold text-primary-900" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Sign in */}
        <Button
          variant="accent"
          size="lg"
          className="mt-8 w-full max-w-xs"
          onClick={() => navigate('/login')}
        >
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="mt-8 text-xs text-primary-300">
          &copy; {new Date().getFullYear()} ALTONS Hotel. All rights reserved.
        </p>
      </div>
    </div>
  )
}
