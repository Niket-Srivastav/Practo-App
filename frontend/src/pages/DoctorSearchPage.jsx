import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doctorsAPI } from '../api/client'
import toast from 'react-hot-toast'
import {
  Search, MapPin, SlidersHorizontal, Star, Clock, IndianRupee,
  ChevronLeft, ChevronRight, Stethoscope, User, ArrowRight,
  Loader, AlertCircle, X
} from 'lucide-react'

const SPECIALITIES = [
  '', 'General Medicine', 'Cardiology', 'Dermatology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Ophthalmology',
  'Gynecology', 'ENT', 'Oncology', 'Urology',
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'fee_asc', label: 'Fee: Low to High' },
  { value: 'fee_desc', label: 'Fee: High to Low' },
  { value: 'exp_desc', label: 'Most Experienced' },
]

const AVATAR_GRADIENTS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
]

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4 border border-white/8">
      <div className="flex items-start gap-4">
        <div className="skeleton w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-36" />
          <div className="skeleton h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-3/4" />
      </div>
    </div>
  )
}

function DoctorCard({ doctor, idx }) {
  const navigate = useNavigate()
  const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]
  const initials = doctor.doctorName
    ? doctor.doctorName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'DR'

  return (
    <div className="glass-hover rounded-2xl border border-white/8 overflow-hidden flex flex-col group">
      {/* Top gradient strip */}
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base truncate">Dr. {doctor.doctorName}</h3>
            <p className="text-cyan-400 text-sm font-medium">{doctor.speciality}</p>
            {doctor.location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <MapPin size={11} />
                <span className="truncate">{doctor.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/6">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock size={12} className="text-violet-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Experience</span>
            </div>
            <p className="text-white font-semibold text-sm">
              {doctor.experienceYears} {doctor.experienceYears === 1 ? 'yr' : 'yrs'}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/6">
            <div className="flex items-center gap-1.5 mb-1">
              <IndianRupee size={12} className="text-emerald-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Fee</span>
            </div>
            <p className="text-emerald-400 font-semibold text-sm">
              ₹{doctor.consultationFee?.toLocaleString('en-IN') ?? '–'}
            </p>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() => navigate(`/book/${doctor.doctorId}`, { state: { doctor } })}
          className="btn-primary w-full justify-center mt-auto"
        >
          <span>Book Appointment</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}

export default function DoctorSearchPage() {
  const [doctors, setDoctors] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [filters, setFilters] = useState({
    speciality: '', location: '', sort: '', page: 1, limit: 9,
  })

  const [pending, setPending] = useState({ speciality: '', location: '', sort: '' })

  const fetchDoctors = useCallback(async (params) => {
    setLoading(true)
    try {
      const res = await doctorsAPI.search({
        speciality: params.speciality || undefined,
        location: params.location || undefined,
        sort: params.sort || undefined,
        page: params.page,
        limit: params.limit,
      })
      const { doctors: list, totalCount: count } = res.data.data
      setDoctors(list || [])
      setTotalCount(count || 0)
    } catch (err) {
      toast.error('Failed to load doctors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDoctors(filters) }, [filters, fetchDoctors])

  const applyFilters = () => {
    setFilters((f) => ({ ...f, ...pending, page: 1 }))
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    const reset = { speciality: '', location: '', sort: '' }
    setPending(reset)
    setFilters((f) => ({ ...f, ...reset, page: 1 }))
    setFiltersOpen(false)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / filters.limit))
  const hasFilters = filters.speciality || filters.location || filters.sort

  return (
    <div className="page-container pt-24 pb-16 min-h-screen">
      {/* Background orbs */}
      <div className="orb w-[400px] h-[400px] top-[-100px] right-[-100px] bg-cyan-500/10" />
      <div className="orb w-[300px] h-[300px] bottom-[200px] left-[-80px] bg-violet-600/10" />

      <div className="max-w-7xl mx-auto px-4">
        {/* Page header */}
        <div className="mb-8">
          <p className="section-label mb-2">Doctors</p>
          <h1 className="font-display font-bold text-4xl text-white">
            Find the right <span className="gradient-text">specialist</span>
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            {totalCount > 0
              ? `${totalCount} doctor${totalCount !== 1 ? 's' : ''} found`
              : 'Search across all specialities and locations'}
          </p>
        </div>

        {/* Search bar row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Location search */}
          <div className="flex-1 relative">
            <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              className="select-field pl-9 text-sm"
              value={pending.location}
              onChange={(e) => setPending((p) => ({ ...p, location: e.target.value }))}
            >
              <option value="">All States</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Speciality quick-select */}
          <div className="relative sm:w-52">
            <Stethoscope size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <select
              className="select-field pl-9 text-sm"
              value={pending.speciality}
              onChange={(e) => setPending((p) => ({ ...p, speciality: e.target.value }))}
            >
              {SPECIALITIES.map((s) => <option key={s} value={s}>{s || 'All Specialities'}</option>)}
            </select>
          </div>

          {/* Filters button */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`btn-secondary px-5 flex items-center gap-2 ${filtersOpen ? 'border-cyan-500/40 text-cyan-400' : ''}`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
          </button>

          {/* Search button */}
          <button onClick={applyFilters} className="btn-primary px-6">
            <Search size={16} />
            <span>Search</span>
          </button>
        </div>

        {/* Expanded filters panel */}
        <div className={`overflow-hidden transition-all duration-300 ${filtersOpen ? 'max-h-40 mb-6' : 'max-h-0'}`}>
          <div className="glass rounded-2xl p-5 border border-white/8 flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-40">
              <label className="text-xs text-slate-500 uppercase tracking-wider">Sort by</label>
              <select
                className="select-field text-sm"
                value={pending.sort}
                onChange={(e) => setPending((p) => ({ ...p, sort: e.target.value }))}
              >
                {SORT_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilters} className="btn-primary py-2.5 px-5 text-sm">Apply</button>
              {hasFilters && (
                <button onClick={clearFilters} className="btn-secondary py-2.5 px-4 text-sm gap-1.5">
                  <X size={13} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active filter pills */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {filters.speciality && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
                <Stethoscope size={11} /> {filters.speciality}
              </span>
            )}
            {filters.location && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
                <MapPin size={11} /> {filters.location}
              </span>
            )}
            {filters.sort && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <Star size={11} /> {SORT_OPTIONS.find(o => o.value === filters.sort)?.label}
              </span>
            )}
          </div>
        )}

        {/* Results grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <AlertCircle size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-400 text-lg font-medium">No doctors found</p>
            <p className="text-slate-600 text-sm">Try adjusting your filters or search terms.</p>
            <button onClick={clearFilters} className="btn-secondary text-sm mt-2">Clear filters</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc, idx) => (
              <DoctorCard key={doc.doctorId} doctor={doc} idx={idx} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              disabled={filters.page <= 1}
              className="btn-secondary p-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => setFilters((f) => ({ ...f, page: p }))}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filters.page === p
                        ? 'bg-gradient-to-br from-cyan-500/30 to-violet-600/30 text-white border border-cyan-500/30'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              disabled={filters.page >= totalPages}
              className="btn-secondary p-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
