import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../api/client'
import toast from 'react-hot-toast'
import {
  Stethoscope, User, Mail, Lock, MapPin, Eye, EyeOff,
  Briefcase, DollarSign, ArrowRight, CheckCircle, Loader
} from 'lucide-react'

const TABS = [
  { id: 'login',    label: 'Sign In' },
  { id: 'patient',  label: 'Register Patient' },
  { id: 'doctor',   label: 'Register Doctor' },
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // Union Territories
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const SPECIALITIES = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Ophthalmology',
  'Gynecology', 'ENT', 'Oncology', 'Urology',
]

function InputRow({ icon: Icon, label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <Icon size={12} className="text-cyan-500" />
        {label}
      </label>
      {children}
    </div>
  )
}

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const initTab = searchParams.get('tab') === 'register' ? 'patient' : 'login'
  const [tab, setTab] = useState(initTab)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '', email: '', password: '', location: '',
    speciality: '', experienceYears: '', consultationFee: '',
  })

  const { login, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/') }, [user])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (tab === 'login') {
        const data = await login({ username: form.username, email: form.email, password: form.password })
        toast.success(`Welcome back! Signed in as ${data.role}`)
        navigate(data.role === 'DOCTOR' ? '/dashboard' : '/doctors')

      } else if (tab === 'patient') {
        await authAPI.registerUser({
          username: form.username, email: form.email,
          password: form.password, location: form.location,
        })
        toast.success('Account created! Please sign in.')
        setTab('login')

      } else {
        await authAPI.registerDoctor({
          username: form.username, email: form.email,
          password: form.password, location: form.location,
          speciality: form.speciality,
          experienceYears: parseInt(form.experienceYears) || 0,
          consultationFee: parseFloat(form.consultationFee) || 0,
        })
        toast.success('Doctor account created! Please sign in.')
        setTab('login')
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/40 via-[#060b18] to-violet-900/40" />
        <div className="orb w-96 h-96 top-[-80px] left-[-80px] bg-cyan-500/25 animate-blob" />
        <div className="orb w-72 h-72 bottom-20 right-10 bg-violet-600/20 animate-blob" style={{ animationDelay: '5s' }} />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, #06b6d4 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-16 space-y-10">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
                <Stethoscope size={20} className="text-white" />
              </div>
              <span className="font-display font-bold text-2xl text-white">Med<span className="gradient-text">Book</span></span>
            </div>
            <h2 className="font-display font-bold text-4xl text-white leading-tight mb-4">
              Your health,<br />
              <span className="gradient-text">our priority.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Connect with verified specialists, book in seconds, and pay securely. Healthcare made simple.
            </p>
          </div>
          <div className="space-y-4">
            {[
              'Instant slot booking with real-time availability',
              'Razorpay-secured payments with auto-refunds',
              'Email notifications via Kafka messaging',
              'Role-based access for patients and doctors',
            ].map((text) => (
              <div key={text} className="flex items-start gap-3">
                <CheckCircle size={16} className="text-cyan-500 mt-0.5 shrink-0" />
                <span className="text-slate-400 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-6">
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <Stethoscope size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Med<span className="gradient-text">Book</span></span>
          </div>

          {/* Tabs */}
          <div className="glass rounded-2xl p-1.5 flex gap-1">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  tab === id
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-600/20 text-white border border-cyan-500/25'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Main form card */}
          <div className="glass rounded-2xl p-7 border border-white/8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

            <div className="mb-6">
              <h1 className="font-display font-bold text-2xl text-white">
                {tab === 'login' ? 'Welcome back' : tab === 'patient' ? 'Create patient account' : 'Join as a Doctor'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {tab === 'login' ? 'Sign in to access your account.' : 'Fill in your details to get started.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <InputRow icon={User} label="Username">
                <input
                  className="input-field"
                  type="text"
                  placeholder="johndoe"
                  value={form.username}
                  onChange={set('username')}
                  required
                />
              </InputRow>

              {/* Email */}
              <InputRow icon={Mail} label="Email Address">
                <input
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </InputRow>

              {/* Password */}
              <InputRow icon={Lock} label="Password">
                <div className="relative">
                  <input
                    className="input-field pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </InputRow>

              {/* Location (register only) */}
              {(tab === 'patient' || tab === 'doctor') && (
                <InputRow icon={MapPin} label="State">
                  <select
                    className="select-field"
                    value={form.location}
                    onChange={set('location')}
                  >
                    <option value="">Select your state…</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </InputRow>
              )}

              {/* Doctor-specific fields */}
              {tab === 'doctor' && (
                <>
                  <InputRow icon={Stethoscope} label="Speciality">
                    <select className="select-field" value={form.speciality} onChange={set('speciality')} required>
                      <option value="">Select speciality…</option>
                      {SPECIALITIES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </InputRow>
                  <div className="grid grid-cols-2 gap-3">
                    <InputRow icon={Briefcase} label="Years Exp.">
                      <input
                        className="input-field"
                        type="number"
                        min="0"
                        placeholder="5"
                        value={form.experienceYears}
                        onChange={set('experienceYears')}
                        required
                      />
                    </InputRow>
                    <InputRow icon={DollarSign} label="Fee (₹)">
                      <input
                        className="input-field"
                        type="number"
                        min="0"
                        step="50"
                        placeholder="500"
                        value={form.consultationFee}
                        onChange={set('consultationFee')}
                        required
                      />
                    </InputRow>
                  </div>
                </>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-2"
              >
                {loading ? (
                  <><Loader size={16} className="animate-spin" /><span>Please wait…</span></>
                ) : (
                  <><span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-600 text-sm">
            {tab === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => setTab('patient')} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Register here
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setTab('login')} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
