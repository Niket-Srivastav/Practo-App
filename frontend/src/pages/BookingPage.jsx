import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { availabilityAPI, appointmentsAPI } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Calendar, Clock, IndianRupee, MapPin, ArrowLeft, CheckCircle,
  Loader, AlertCircle, CreditCard, Stethoscope, User, ArrowRight,
  ChevronLeft, ChevronRight
} from 'lucide-react'

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

function getDatesBetween(start, days = 14) {
  const dates = []
  const d = new Date(start)
  for (let i = 0; i < days; i++) {
    dates.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function BookingPage() {
  const { doctorId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const doctor = state?.doctor
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()))
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [step, setStep] = useState('slots') // 'slots' | 'confirm' | 'success'
  const [successData, setSuccessData] = useState(null)
  const [dateOffset, setDateOffset] = useState(0)

  const dates = getDatesBetween(new Date(), 21).slice(dateOffset, dateOffset + 7)

  useEffect(() => {
    fetchSlots(selectedDate)
  }, [selectedDate, doctorId])

  const fetchSlots = async (date) => {
    if (!doctorId) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    try {
      const res = await availabilityAPI.getByDoctor(doctorId, { date, page: 1, limit: 30 })
      const data = res.data.data
      setSlots(data?.availabilityResponse || [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const openRazorpay = (checkoutOpts, appointmentId, orderId) => {
    const opts = JSON.parse(checkoutOpts)
    const rzpOptions = {
      key: opts.key,
      amount: opts.amount,
      currency: opts.currency || 'INR',
      order_id: opts.order_id,
      name: 'MedBook',
      description: `Consultation with Dr. ${doctor?.doctorName || 'Doctor'}`,
      prefill: { email: opts.prefill?.email || user?.email || '' },
      theme: { color: '#06b6d4' },
      handler: async (response) => {
        try {
          await appointmentsAPI.paymentCallback({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          setSuccessData({
            appointmentId,
            paymentId: response.razorpay_payment_id,
            slot: selectedSlot,
          })
          setStep('success')
          toast.success('Appointment confirmed!')
        } catch {
          toast.error('Payment verification failed. Contact support.')
        }
      },
      modal: {
        ondismiss: () => toast('Payment cancelled. Your slot is still held briefly.', { icon: '⚠️' }),
      },
    }

    if (typeof window.Razorpay === 'undefined') {
      toast.error('Razorpay SDK not loaded. Please refresh the page.')
      return
    }
    const rzp = new window.Razorpay(rzpOptions)
    rzp.open()
  }

  const handleBook = async () => {
    if (!selectedSlot) return
    setBooking(true)
    try {
      const res = await appointmentsAPI.book({ availabilityId: selectedSlot.availabilityId })
      const { appointmentId, checkoutOptions, gatewayOrderId } = res.data.data
      openRazorpay(checkoutOptions, appointmentId, gatewayOrderId)
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Slot may already be taken.'
      toast.error(msg)
    } finally {
      setBooking(false)
    }
  }

  // ── GRADIENT for doctor avatar ──────────────────────────────────────────
  const grad = 'from-cyan-500 to-violet-600'
  const initials = doctor?.doctorName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'DR'

  // ── SUCCESS STATE ────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="page-container min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
            <CheckCircle size={40} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-3xl text-white">Booking Confirmed!</h2>
            <p className="text-slate-400 mt-2">A confirmation email has been sent to the doctor.</p>
          </div>
          <div className="glass rounded-2xl p-5 border border-white/10 text-left space-y-3">
            {[
              { label: 'Appointment ID', value: `#${successData?.appointmentId}` },
              { label: 'Payment ID', value: successData?.paymentId?.slice(0, 20) + '…' },
              { label: 'Date', value: successData?.slot?.availableDate },
              { label: 'Time', value: formatTime(successData?.slot?.startTime) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/appointments')} className="btn-primary flex-1 justify-center">
              <span>View Appointments</span>
              <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate('/doctors')} className="btn-secondary flex-1 justify-center">
              Find More
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to search
        </button>

        {/* Doctor Info Card */}
        {doctor && (
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-violet-600" />
            <div className="p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0`}>
                {initials}
              </div>
              <div className="flex-1">
                <h2 className="font-display font-bold text-xl text-white">Dr. {doctor.doctorName}</h2>
                <p className="text-cyan-400 text-sm">{doctor.speciality}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5"><Clock size={13} className="text-violet-400" />{doctor.experienceYears} yrs experience</span>
                  {doctor.location && <span className="flex items-center gap-1.5"><MapPin size={13} className="text-rose-400" />{doctor.location}</span>}
                  <span className="flex items-center gap-1.5"><IndianRupee size={13} className="text-emerald-400" />₹{doctor.consultationFee?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Date + Slots */}
          <div className="space-y-5">
            {/* Date picker */}
            <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-cyan-400" /> Select Date
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDateOffset(Math.max(0, dateOffset - 7))}
                    disabled={dateOffset === 0}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setDateOffset(dateOffset + 7)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {dates.map((d) => {
                  const str = formatDate(d)
                  const isSelected = str === selectedDate
                  const isToday = str === formatDate(new Date())
                  return (
                    <button
                      key={str}
                      onClick={() => setSelectedDate(str)}
                      className={`flex flex-col items-center py-3 px-1 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-b from-cyan-500/30 to-violet-600/20 text-white border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                          : 'hover:bg-white/5 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span className="text-[10px] uppercase opacity-70">
                        {d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2)}
                      </span>
                      <span className={`text-base font-bold mt-0.5 ${isSelected ? 'text-white' : ''}`}>
                        {d.getDate()}
                      </span>
                      {isToday && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Slots grid */}
            <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Clock size={16} className="text-violet-400" />
                Available Slots
                {!loadingSlots && (
                  <span className="ml-auto text-xs text-slate-500 font-normal">
                    {slots.filter(s => !s.isBooked).length} available
                  </span>
                )}
              </h3>

              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <Loader size={24} className="text-cyan-500 animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <AlertCircle size={28} className="text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-sm">No slots available for this date.</p>
                  <p className="text-slate-600 text-xs">Try selecting a different date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.availabilityId}
                      disabled={slot.isBooked}
                      onClick={() => setSelectedSlot(slot.isBooked ? null : slot)}
                      className={`slot-pill ${
                        slot.isBooked ? 'booked' :
                        selectedSlot?.availabilityId === slot.availabilityId ? 'selected' : 'available'
                      }`}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary & Book */}
          <div className="space-y-4">
            <div className="glass rounded-2xl border border-white/10 overflow-hidden sticky top-24">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-5 space-y-5">
                <h3 className="font-semibold text-white">Booking Summary</h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <User size={15} className="text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-xs">Doctor</p>
                      <p className="text-white font-medium">Dr. {doctor?.doctorName || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Stethoscope size={15} className="text-violet-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-xs">Speciality</p>
                      <p className="text-white font-medium">{doctor?.speciality || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Calendar size={15} className="text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-xs">Date</p>
                      <p className="text-white font-medium">
                        {selectedSlot?.availableDate || selectedDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Clock size={15} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-slate-500 text-xs">Time</p>
                      <p className={`font-medium ${selectedSlot ? 'text-white' : 'text-slate-600'}`}>
                        {selectedSlot ? formatTime(selectedSlot.startTime) : 'Select a slot'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fee */}
                <div className="border-t border-white/8 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Consultation Fee</span>
                    <span className="text-emerald-400 font-bold text-lg">
                      ₹{doctor?.consultationFee?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Inclusive of all charges</p>
                </div>

                <button
                  onClick={handleBook}
                  disabled={!selectedSlot || booking}
                  className="btn-primary w-full justify-center py-3.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {booking ? (
                    <><Loader size={16} className="animate-spin" /><span>Creating order…</span></>
                  ) : (
                    <><CreditCard size={16} /><span>Pay ₹{doctor?.consultationFee?.toLocaleString('en-IN')}</span></>
                  )}
                </button>
                <p className="text-[11px] text-slate-600 text-center">Secured by Razorpay · Refundable on cancellation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
