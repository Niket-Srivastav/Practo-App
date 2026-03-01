import { useState, useEffect, useCallback } from 'react'
import { availabilityAPI } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Plus, Calendar, Clock, CheckCircle, Stethoscope,
  Loader, ArrowRight, LayoutDashboard, Info,
  Users, Mail, ChevronLeft, ChevronRight, UserCheck, CircleDot
} from 'lucide-react'

function InfoCard({ icon: Icon, label, value, gradient, accent }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/8 flex items-center gap-4 group hover:border-white/15 transition-all duration-300">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-slate-500 text-xs">{label}</p>
        <p className={`font-bold text-xl ${accent}`}>{value}</p>
      </div>
    </div>
  )
}

const TIME_PRESETS = [
  { label: '9:00 AM', start: '09:00', end: '09:30' },
  { label: '10:00 AM', start: '10:00', end: '10:30' },
  { label: '11:00 AM', start: '11:00', end: '11:30' },
  { label: '12:00 PM', start: '12:00', end: '12:30' },
  { label: '2:00 PM', start: '14:00', end: '14:30' },
  { label: '3:00 PM', start: '15:00', end: '15:30' },
  { label: '4:00 PM', start: '16:00', end: '16:30' },
  { label: '5:00 PM', start: '17:00', end: '17:30' },
]

const STATUS_META = {
  CONFIRMED:  { label: 'Confirmed',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  WAITING:    { label: 'Waiting',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  CANCELLED:  { label: 'Cancelled',  color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20' },
  FAILED:     { label: 'Failed',     color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20' },
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const [form, setForm] = useState({ availableDate: '', startTime: '', endTime: '' })
  const [loading, setLoading] = useState(false)
  const [addedSlots, setAddedSlots] = useState([])

  // ── My Schedule state ──────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const [scheduleDate, setScheduleDate] = useState(todayStr)
  const [scheduleSlots, setScheduleSlots] = useState([])
  const [scheduleTotalCount, setScheduleTotalCount] = useState(0)
  const [schedulePage, setSchedulePage] = useState(1)
  const scheduleLimit = 10
  const [scheduleLoading, setScheduleLoading] = useState(false)

  const scheduleTotalPages = Math.max(1, Math.ceil(scheduleTotalCount / scheduleLimit))

  const fetchSchedule = useCallback(async (date, page) => {
    setScheduleLoading(true)
    try {
      const res = await availabilityAPI.getMySlots({ date, page, limit: scheduleLimit })
      setScheduleSlots(res.data.data.slots || [])
      setScheduleTotalCount(res.data.data.totalcount ?? 0)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load schedule')
    } finally {
      setScheduleLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedule(scheduleDate, schedulePage)
  }, [scheduleDate, schedulePage, fetchSchedule])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const applyPreset = (preset) => {
    setForm((f) => ({ ...f, startTime: preset.start, endTime: preset.end }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.availableDate || !form.startTime || !form.endTime) {
      toast.error('Please fill in all fields')
      return
    }
    if (form.startTime >= form.endTime) {
      toast.error('End time must be after start time')
      return
    }
    setLoading(true)
    try {
      const res = await availabilityAPI.add({
        availableDate: form.availableDate,
        startTime: form.startTime + ':00',
        endTime: form.endTime + ':00',
      })
      toast.success(res.data.message || 'Slot added successfully!')
      setAddedSlots((prev) => [{ ...form, id: Date.now() }, ...prev])
      setForm((f) => ({ ...f, startTime: '', endTime: '' }))
      // refresh schedule if the new slot is on the currently viewed date
      if (form.availableDate === scheduleDate) {
        fetchSchedule(scheduleDate, schedulePage)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add slot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container min-h-screen pt-24 pb-16 px-4">
      <div className="orb w-[400px] h-[400px] top-[-80px] right-[-80px] bg-violet-600/10" />
      <div className="orb w-[300px] h-[300px] bottom-20 left-[-60px] bg-cyan-500/8" />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="section-label">Doctor Portal</p>
          </div>
          <h1 className="font-display font-bold text-4xl text-white">
            Welcome back, <span className="gradient-text">Doctor</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your availability and keep your schedule up to date.</p>
        </div>

        {/* Info cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard icon={LayoutDashboard} label="User ID"   value={`#${user?.userId}`} gradient="from-cyan-500 to-blue-600"   accent="text-cyan-400" />
          <InfoCard icon={Stethoscope}    label="Role"       value="Doctor"              gradient="from-violet-500 to-purple-600" accent="text-violet-400" />
          <InfoCard icon={Calendar}       label="Slots Added" value={addedSlots.length}   gradient="from-emerald-500 to-teal-600" accent="text-emerald-400" />
          <InfoCard icon={CheckCircle}    label="Status"     value="Active"              gradient="from-rose-500 to-pink-600"    accent="text-rose-400" />
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Add Slot Form */}
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-violet-600" />
            <div className="p-6 space-y-5">
              <div>
                <h2 className="font-display font-semibold text-xl text-white flex items-center gap-2">
                  <Plus size={18} className="text-cyan-400" />
                  Add Availability Slot
                </h2>
                <p className="text-slate-500 text-sm mt-1">Patients can see and book these time slots.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={12} className="text-cyan-500" /> Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    className="input-field"
                    value={form.availableDate}
                    onChange={set('availableDate')}
                    required
                  />
                </div>

                {/* Time presets */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Quick Presets</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className={`py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                          form.startTime === p.start
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'border-white/8 text-slate-500 hover:text-white hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual time inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12} className="text-violet-500" /> Start Time
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      value={form.startTime}
                      onChange={set('startTime')}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12} className="text-rose-500" /> End Time
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      value={form.endTime}
                      onChange={set('endTime')}
                      required
                    />
                  </div>
                </div>

                {/* Preview */}
                {form.availableDate && form.startTime && form.endTime && (
                  <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-xl p-3 flex items-center gap-3 text-sm">
                    <Info size={15} className="text-cyan-400 shrink-0" />
                    <span className="text-cyan-300">
                      Slot on <strong>{form.availableDate}</strong> from{' '}
                      <strong>{form.startTime}</strong> to <strong>{form.endTime}</strong>
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  {loading ? (
                    <><Loader size={16} className="animate-spin" /><span>Adding…</span></>
                  ) : (
                    <><Plus size={16} /><span>Add Slot</span></>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Recently added slots */}
          <div className="space-y-4">
            <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-400" />
                Recently Added
                {addedSlots.length > 0 && (
                  <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {addedSlots.length} slots
                  </span>
                )}
              </h3>

              {addedSlots.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Calendar size={28} className="text-slate-700 mx-auto" />
                  <p className="text-slate-600 text-sm">No slots added yet.</p>
                  <p className="text-slate-700 text-xs">Add your first availability slot.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                  {addedSlots.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/6"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                        <CheckCircle size={14} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{s.availableDate}</p>
                        <p className="text-slate-500 text-xs">{s.startTime} — {s.endTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guide card */}
            <div className="glass rounded-2xl border border-amber-500/15 p-5 space-y-3">
              <h4 className="text-amber-300 font-semibold text-sm flex items-center gap-2">
                <Info size={14} /> Tips
              </h4>
              <ul className="space-y-2 text-slate-500 text-xs list-none">
                {[
                  'Add slots at least 1 day in advance',
                  'Each slot = one patient appointment',
                  'Booked slots cannot be removed',
                  'Patients receive email confirmation instantly',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <ArrowRight size={10} className="text-amber-500 mt-0.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── My Schedule ─────────────────────────────────────────────── */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-cyan-500" />
          <div className="p-6 space-y-5">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="font-display font-semibold text-xl text-white flex items-center gap-2">
                  <Users size={18} className="text-violet-400" />
                  My Schedule
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">View all your slots and patient bookings for any date.</p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-500" />
                <input
                  type="date"
                  className="input-field !py-2 !text-sm"
                  value={scheduleDate}
                  onChange={(e) => { setScheduleDate(e.target.value); setSchedulePage(1) }}
                />
                <button
                  onClick={() => fetchSchedule(scheduleDate, schedulePage)}
                  className="btn-secondary !py-2 !px-3 !text-sm"
                  title="Refresh"
                >
                  {scheduleLoading
                    ? <Loader size={14} className="animate-spin" />
                    : <ArrowRight size={14} />}
                </button>
              </div>
            </div>

            {/* Slot list */}
            {scheduleLoading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
                <Loader size={20} className="animate-spin" />
                <span className="text-sm">Loading slots…</span>
              </div>
            ) : scheduleSlots.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Calendar size={32} className="text-slate-700 mx-auto" />
                <p className="text-slate-500 text-sm">No slots found for {scheduleDate}.</p>
                <p className="text-slate-700 text-xs">Add availability slots using the form above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduleSlots.map((slot) => {
                  const status = STATUS_META[slot.appointmentStatus] ?? null
                  return (
                    <div
                      key={slot.availabilityId}
                      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all duration-200 ${
                        slot.isBooked
                          ? 'bg-violet-500/5 border-violet-500/20'
                          : 'bg-white/[0.02] border-white/6'
                      }`}
                    >
                      {/* Time block */}
                      <div className="flex items-center gap-3 min-w-[160px]">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          slot.isBooked
                            ? 'bg-violet-500/15 border border-violet-500/25'
                            : 'bg-emerald-500/10 border border-emerald-500/20'
                        }`}>
                          {slot.isBooked
                            ? <UserCheck size={15} className="text-violet-400" />
                            : <CircleDot size={15} className="text-emerald-400" />}
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">
                            {slot.startTime?.slice(0, 5)} – {slot.endTime?.slice(0, 5)}
                          </p>
                          <p className={`text-xs font-medium ${
                            slot.isBooked ? 'text-violet-400' : 'text-emerald-400'
                          }`}>
                            {slot.isBooked ? 'Booked' : 'Available'}
                          </p>
                        </div>
                      </div>

                      {/* Patient info (only when booked) */}
                      {slot.isBooked && slot.patientUsername ? (
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 text-xs font-bold">
                              {slot.patientUsername[0].toUpperCase()}
                            </div>
                            <span className="text-white text-sm font-medium">{slot.patientUsername}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <Mail size={11} className="text-slate-500" />
                            {slot.patientEmail}
                          </div>
                          {status && (
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${status.bg} ${status.color}`}>
                              {status.label}
                            </span>
                          )}
                        </div>
                      ) : slot.isBooked ? (
                        <span className="text-slate-600 text-xs italic">Patient info unavailable</span>
                      ) : (
                        <span className="text-slate-600 text-xs">Waiting for a patient to book this slot.</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {scheduleTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/6">
                <p className="text-slate-600 text-xs">
                  Page {schedulePage} of {scheduleTotalPages} &middot; {scheduleTotalCount} total slots
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={schedulePage <= 1}
                    onClick={() => setSchedulePage((p) => p - 1)}
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={schedulePage >= scheduleTotalPages}
                    onClick={() => setSchedulePage((p) => p + 1)}
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
