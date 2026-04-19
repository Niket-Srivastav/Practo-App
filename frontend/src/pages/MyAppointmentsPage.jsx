import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { appointmentsAPI } from '../api/client'
import toast from 'react-hot-toast'
import {
  Calendar, Clock, IndianRupee, RefreshCw, Search,
  Loader, CheckCircle, XCircle, AlertCircle, Clock3,
  Stethoscope, CreditCard, X, Eye, ArrowRight, Video
} from 'lucide-react'

function formatTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  return `${hour % 12 || 12}:${m} ${ampm}`
}

function StatusBadge({ status }) {
  const map = {
    CONFIRMED: { cls: 'badge-confirmed', icon: CheckCircle, label: 'Confirmed' },
    WAITING:   { cls: 'badge-waiting',   icon: Clock3,     label: 'Waiting' },
    CANCELLED: { cls: 'badge-cancelled', icon: XCircle,    label: 'Cancelled' },
    FAILED:    { cls: 'badge-failed',    icon: AlertCircle,label: 'Failed' },
  }
  const cfg = map[status] || map.FAILED
  const Icon = cfg.icon
  return (
    <span className={`badge ${cfg.cls}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function PaymentBadge({ status }) {
  const map = {
    SUCCESS:  { cls: 'badge-success', label: 'Paid' },
    PENDING:  { cls: 'badge-pending', label: 'Pending' },
    FAILED:   { cls: 'badge-failed',  label: 'Failed' },
    REFUNDED: { cls: 'badge-waiting', label: 'Refunded' },
  }
  const cfg = map[status] || { cls: 'badge-pending', label: status }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 border border-white/8 space-y-4">
      <div className="flex items-start gap-4">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-12 rounded-xl" />
      </div>
    </div>
  )
}

function ConfirmCancelModal({ appointment, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl border border-white/10 p-6 max-w-sm w-full space-y-5 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
            <AlertCircle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Cancel Appointment</h3>
            <p className="text-slate-500 text-xs">This action cannot be undone</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-slate-400 text-sm">
          Are you sure you want to cancel appointment{' '}
          <span className="text-white font-medium">#{appointment.appointmentId}</span>?
          A full refund of{' '}
          <span className="text-emerald-400 font-medium">₹{appointment.amount}</span>{' '}
          will be initiated to your original payment method.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Keep it</button>
          <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
            {loading ? <Loader size={14} className="animate-spin" /> : <><XCircle size={14} /><span>Cancel</span></>}
          </button>
        </div>
      </div>
    </div>
  )
}

const FILTER_TABS = ['ALL', 'CONFIRMED', 'WAITING', 'CANCELLED', 'FAILED']

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await appointmentsAPI.getMyAppointments()
      setAppointments(res.data.data || [])
    } catch {
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await appointmentsAPI.cancel(cancelTarget.appointmentId)
      toast.success('Appointment cancelled. Refund initiated.')
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === cancelTarget.appointmentId
            ? { ...a, status: 'CANCELLED', paymentStatus: 'REFUNDED' }
            : a
        )
      )
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed')
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  const filtered = appointments.filter((a) => {
    const matchStatus = activeFilter === 'ALL' || a.status === activeFilter
    const matchSearch = !searchQuery || a.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(a.appointmentId).includes(searchQuery)
    return matchStatus && matchSearch
  })

  const counts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'ALL' ? appointments.length : appointments.filter(a => a.status === tab).length
    return acc
  }, {})

  return (
    <div className="page-container min-h-screen pt-24 pb-16 px-4">
      <div className="orb w-[350px] h-[350px] top-10 right-0 bg-violet-600/8" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <p className="section-label mb-1">Patient Portal</p>
            <h1 className="font-display font-bold text-4xl text-white">
              My <span className="gradient-text">Appointments</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {appointments.length} total · {counts.CONFIRMED} confirmed
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAppointments} disabled={loading} className="btn-secondary p-2.5">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => navigate('/doctors')} className="btn-primary text-sm px-5">
              <span>Book New</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Filter tabs + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  activeFilter === tab
                    ? 'bg-gradient-to-r from-cyan-500/25 to-violet-600/25 text-white border border-cyan-500/30'
                    : 'text-slate-500 hover:text-white glass border border-transparent hover:border-white/10'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                {counts[tab] > 0 && (
                  <span className={`ml-1.5 text-[10px] ${activeFilter === tab ? 'opacity-80' : 'opacity-40'}`}>
                    {counts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="sm:ml-auto relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input-field pl-9 py-2 text-sm w-full sm:w-48"
              placeholder="Search doctor, ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Calendar size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-lg font-medium">No appointments found</p>
            {activeFilter !== 'ALL' || searchQuery ? (
              <button onClick={() => { setActiveFilter('ALL'); setSearchQuery('') }} className="btn-secondary text-sm">Clear filters</button>
            ) : (
              <button onClick={() => navigate('/doctors')} className="btn-primary text-sm px-6">
                <span>Book Your First Appointment</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((appt) => (
              <AppointmentCard
                key={appt.appointmentId}
                appointment={appt}
                onCancel={() => setCancelTarget(appt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <ConfirmCancelModal
          appointment={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}
    </div>
  )
}

function AppointmentCard({ appointment: appt, onCancel }) {
  const navigate = useNavigate()
  const canCancel = appt.status === 'CONFIRMED'
  const canCall   = appt.status === 'CONFIRMED'

  return (
    <div className={`glass rounded-2xl border overflow-hidden transition-all duration-300 ${
      appt.status === 'CONFIRMED' ? 'border-emerald-500/15 hover:border-emerald-500/25' :
      appt.status === 'CANCELLED' ? 'border-red-500/10' :
      'border-white/8 hover:border-white/15'
    }`}>
      {/* Status stripe */}
      <div className={`h-0.5 ${
        appt.status === 'CONFIRMED' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
        appt.status === 'WAITING'   ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
        appt.status === 'CANCELLED' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
        'bg-slate-700'
      }`} />

      <div className="p-5 flex flex-col sm:flex-row gap-5">
        {/* Left: ID block */}
        <div className="flex items-start gap-4 flex-1">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
            appt.status === 'CONFIRMED' ? 'bg-emerald-500/15 border border-emerald-500/20' :
            appt.status === 'WAITING'   ? 'bg-amber-500/15 border border-amber-500/20' :
            'bg-slate-800 border border-slate-700'
          }`}>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">ID</span>
            <span className="text-white font-bold text-sm leading-tight">#{appt.appointmentId}</span>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-semibold text-white">Dr. {appt.doctorName}</span>
              <StatusBadge status={appt.status} />
              <PaymentBadge status={appt.paymentStatus} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-cyan-400" />
                {appt.appointmentDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-violet-400" />
                {formatTime(appt.appointmentTime)}
              </span>
              <span className="flex items-center gap-1.5">
                <IndianRupee size={12} className="text-emerald-400" />
                ₹{appt.amount?.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex sm:flex-col gap-2 sm:w-32">
          <button
            onClick={() => navigate(`/appointments/${appt.appointmentId}/status`)}
            className="btn-secondary flex-1 sm:flex-none justify-center text-xs py-2 px-3 gap-1.5"
          >
            <Eye size={13} />
            Details
          </button>
          {canCall && (
            <button
              onClick={() => navigate(`/video-call/${appt.appointmentId}`)}
              className="btn-primary flex-1 sm:flex-none justify-center text-xs py-2 px-3"
            >
              <Video size={13} />
              <span>Join Call</span>
            </button>
          )}
          {canCancel && (
            <button onClick={onCancel} className="btn-danger flex-1 sm:flex-none justify-center text-xs py-2 px-3">
              <XCircle size={13} />
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
