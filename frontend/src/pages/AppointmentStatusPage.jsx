import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { appointmentsAPI } from '../api/client'
import toast from 'react-hot-toast'
import {
  ArrowLeft, CheckCircle, XCircle, Clock3, AlertCircle,
  Calendar, Clock, IndianRupee, User, Loader
} from 'lucide-react'

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

const STATUS_CONFIG = {
  CONFIRMED: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', label: 'Confirmed', desc: 'Your appointment is confirmed.' },
  WAITING:   { icon: Clock3,      color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/25',   label: 'Waiting',   desc: 'Payment pending confirmation.' },
  CANCELLED: { icon: XCircle,     color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/25',     label: 'Cancelled', desc: 'This appointment was cancelled.' },
  FAILED:    { icon: AlertCircle, color: 'text-slate-400',   bg: 'bg-slate-700',      border: 'border-slate-600',      label: 'Failed',    desc: 'Payment failed or expired.' },
}

export default function AppointmentStatusPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await appointmentsAPI.getStatus(appointmentId)
        setAppointment(res.data.data)
      } catch {
        toast.error('Appointment not found')
        navigate('/appointments')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [appointmentId])

  if (loading) {
    return (
      <div className="page-container min-h-screen pt-24 flex items-center justify-center">
        <Loader size={28} className="text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (!appointment) return null

  const cfg = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.FAILED
  const Icon = cfg.icon

  return (
    <div className="page-container min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        <button onClick={() => navigate('/appointments')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors group">
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          Back to appointments
        </button>

        {/* Status hero */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className={`h-1.5 ${
            appointment.status === 'CONFIRMED' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
            appointment.status === 'WAITING'   ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
            appointment.status === 'CANCELLED' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            'bg-slate-700'
          }`} />
          <div className="p-8 text-center space-y-4">
            <div className={`w-16 h-16 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center mx-auto`}>
              <Icon size={32} className={cfg.color} />
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl text-white">{cfg.label}</h1>
              <p className="text-slate-400 mt-1">{cfg.desc}</p>
            </div>
          </div>
        </div>

        {/* Detail card */}
        <div className="glass rounded-2xl border border-white/10 p-6 space-y-4">
          <h2 className="font-semibold text-white border-b border-white/8 pb-3">Appointment Details</h2>
          <div className="space-y-4">
            {[
              { icon: Calendar, label: 'Appointment ID', value: `#${appointment.appointmentId}`, accent: 'text-cyan-400' },
              { icon: User,      label: 'Doctor',         value: `Dr. ${appointment.doctorName}`, accent: 'text-white' },
              { icon: Calendar, label: 'Date',            value: appointment.appointmentDate,     accent: 'text-white' },
              { icon: Clock,    label: 'Time',            value: formatTime(appointment.appointmentTime), accent: 'text-white' },
              { icon: IndianRupee, label: 'Amount',       value: `₹${appointment.amount?.toLocaleString('en-IN')}`, accent: 'text-emerald-400' },
              { icon: CheckCircle, label: 'Payment',      value: appointment.paymentStatus,       accent: appointment.paymentStatus === 'SUCCESS' ? 'text-emerald-400' : 'text-amber-400' },
            ].map(({ icon: I, label, value, accent }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/8 flex items-center justify-center">
                  <I size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-slate-500 text-sm">{label}</span>
                  <span className={`font-medium text-sm ${accent}`}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => navigate('/appointments')} className="btn-secondary w-full justify-center">
          <ArrowLeft size={15} />
          All Appointments
        </button>
      </div>
    </div>
  )
}
