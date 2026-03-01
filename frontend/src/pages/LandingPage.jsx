import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Search, Calendar, Shield, Bell, ArrowRight, Star,
  Stethoscope, CheckCircle, Users, Award, Zap, ChevronRight
} from 'lucide-react'

const FEATURES = [
  {
    icon: Search,
    title: 'Smart Doctor Search',
    desc: 'Filter by speciality, location, fee and experience. Find the perfect doctor in seconds.',
    color: 'from-cyan-500 to-blue-600',
    bg: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(6, 182, 212, 0.2)',
  },
  {
    icon: Calendar,
    title: 'Instant Slot Booking',
    desc: 'View real-time availability and book with one click. No more phone calls.',
    color: 'from-violet-500 to-purple-600',
    bg: 'rgba(139, 92, 246, 0.08)',
    border: 'rgba(139, 92, 246, 0.2)',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    desc: 'Pay consultation fees via Razorpay with bank-grade security. Instant refunds on cancellation.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.2)',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    desc: 'Get instant email confirmations after booking. Doctors are alerted immediately.',
    color: 'from-amber-500 to-orange-600',
    bg: 'rgba(245, 158, 11, 0.08)',
    border: 'rgba(245, 158, 11, 0.2)',
  },
]

const STEPS = [
  { num: '01', title: 'Sign Up', desc: 'Create your patient or doctor account in under a minute.' },
  { num: '02', title: 'Find Doctor', desc: 'Search by speciality or location to find available doctors.' },
  { num: '03', title: 'Pick a Slot', desc: 'Browse open time slots and choose what works for you.' },
  { num: '04', title: 'Pay & Confirm', desc: 'Secure payment via Razorpay — instant confirmation email.' },
]

const SPECIALITIES = [
  'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'General Medicine', 'Ophthalmology',
]

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="page-container">
      {/* Background orbs */}
      <div className="orb w-[600px] h-[600px] top-[-200px] left-[-200px] bg-cyan-500/20 animate-blob" />
      <div className="orb w-[500px] h-[500px] top-[200px] right-[-150px] bg-violet-600/15 animate-blob" style={{ animationDelay: '4s' }} />
      <div className="orb w-[400px] h-[400px] bottom-[100px] left-[30%] bg-emerald-500/10 animate-blob" style={{ animationDelay: '8s' }} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #06b6d4 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-cyan-500/25 text-xs font-semibold text-cyan-400">
            <Zap size={12} className="fill-current" />
            Powered by Razorpay &amp; Kafka
            <ChevronRight size={12} />
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl text-white leading-tight tracking-tight">
            Healthcare at your
            <br />
            <span className="gradient-text">fingertips</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Book verified doctors instantly, pay securely, and get confirmed — all in one seamless platform built for modern India.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <>
                <Link
                  to={user.role === 'DOCTOR' ? '/dashboard' : '/doctors'}
                  className="btn-primary text-base px-7 py-3"
                >
                  <span>{user.role === 'DOCTOR' ? 'Go to Dashboard' : 'Find a Doctor'}</span>
                  <ArrowRight size={18} />
                </Link>
                {user.role === 'PATIENT' && (
                  <Link to="/appointments" className="btn-secondary text-base px-7 py-3">
                    <Calendar size={16} />
                    My Appointments
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/doctors" className="btn-primary text-base px-7 py-3">
                  <span>Find a Doctor</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/auth" className="btn-secondary text-base px-7 py-3">
                  <Users size={16} />
                  Create Account
                </Link>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            {[
              { icon: CheckCircle, text: 'Verified Doctors' },
              { icon: Shield, text: 'Secure Payments' },
              { icon: Star, text: 'Instant Confirmation' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <Icon size={13} className="text-cyan-500" />
                {text}
              </span>
            ))}
          </div>

          {/* Hero mockup card */}
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="glass rounded-2xl border border-white/10 p-6 relative overflow-hidden">
              {/* Gradient line at top */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { val: '500+', label: 'Doctors', color: 'text-cyan-400' },
                  { val: '20+', label: 'Specialities', color: 'text-violet-400' },
                  { val: '10K+', label: 'Appointments', color: 'text-emerald-400' },
                ].map(({ val, label, color }) => (
                  <div key={label} className="space-y-1">
                    <p className={`font-display font-bold text-3xl ${color} text-glow`}>{val}</p>
                    <p className="text-slate-500 text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECIALITIES MARQUEE ────────────────────────────────── */}
      <section className="relative py-8 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#060b18] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#060b18] to-transparent z-10" />
        <div className="flex gap-4 animate-[scroll_25s_linear_infinite]" style={{ width: 'max-content' }}>
          {[...SPECIALITIES, ...SPECIALITIES].map((s, i) => (
            <span
              key={i}
              className="px-5 py-2 rounded-full glass border border-white/10 text-sm text-slate-400 whitespace-nowrap hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-200 cursor-default"
            >
              <Stethoscope className="inline mr-2 text-cyan-500/60" size={13} />
              {s}
            </span>
          ))}
        </div>

        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <p className="section-label">Why MedBook</p>
            <h2 className="font-display font-bold text-4xl text-white">Everything you need,</h2>
            <h2 className="font-display font-bold text-4xl gradient-text">nothing you don't</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }) => (
              <div
                key={title}
                className="glass-hover rounded-2xl p-6 space-y-4"
                style={{ '--hover-border': border }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <Icon className={`bg-gradient-to-br ${color} bg-clip-text`} size={22} style={{ color: 'transparent', fill: 'none', stroke: `url(#g_${title.replace(/\s/g,'')})` }} />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id={`g_${title.replace(/\s/g,'')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="relative py-24 px-4">
        {/* Divider line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent" />

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <p className="section-label">How it works</p>
            <h2 className="font-display font-bold text-4xl text-white">From search to <span className="gradient-text">confirmation</span></h2>
            <p className="text-slate-400 max-w-xl mx-auto">4 simple steps and your appointment is booked. No paperwork, no waiting on hold.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ num, title, desc }, idx) => (
              <div key={num} className="relative">
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-cyan-500/30 to-transparent z-10" style={{ width: 'calc(100% - 3rem)', left: '3rem' }} />
                )}
                <div className="glass rounded-2xl p-6 space-y-3 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
                  <div className="absolute top-0 right-0 font-display font-bold text-6xl text-white/[0.04] leading-none select-none">{num}</div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-cyan-500/20">
                    {num}
                  </div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────── */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/50 via-[#0a1628] to-violet-900/50" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-600/5" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

            <div className="relative p-10 md:p-16 text-center space-y-6">
              <h2 className="font-display font-bold text-4xl md:text-5xl text-white">
                Ready to book your first
                <br />
                <span className="gradient-text">appointment?</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Join thousands of patients who trust MedBook for fast, reliable healthcare access.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to={user ? '/doctors' : '/auth?tab=register'} className="btn-primary text-base px-8 py-3.5">
                  <span>{user ? 'Find a Doctor' : 'Get Started Free'}</span>
                  <ArrowRight size={18} />
                </Link>
                {!user && (
                  <Link to="/auth" className="btn-secondary text-base px-8 py-3.5">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Stethoscope size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-white">Med<span className="gradient-text">Book</span></span>
          </div>
          <p className="text-slate-600 text-sm">© 2026 MedBook. Built with Spring Boot + React.</p>
          <div className="flex gap-4">
            <Link to="/doctors" className="text-slate-500 hover:text-cyan-400 text-sm transition-colors">Find Doctors</Link>
            <Link to="/auth" className="text-slate-500 hover:text-cyan-400 text-sm transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
