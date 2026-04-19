import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  registerUser: (data) => api.post('/auth/register/user', data),
  registerDoctor: (data) => api.post('/auth/register/doctor', data),
  login: (data) => api.post('/auth/login', data),
}

// ─── Doctors ───────────────────────────────────────────────────────────────
export const doctorsAPI = {
  search: (params) => api.get('/doctors', { params }),
}

// ─── Availability ──────────────────────────────────────────────────────────
export const availabilityAPI = {
  add: (data) => api.post('/availability/add', data),
  getByDoctor: (doctorId, params) => api.get(`/availability/${doctorId}`, { params }),
  getMySlots: (params) => api.get('/availability/my-slots', { params }),
}

// ─── Appointments ──────────────────────────────────────────────────────────
export const appointmentsAPI = {
  book: (data) => api.post('/appointments/book', data),
  paymentCallback: (data) => api.post('/appointments/payment-callback', data),
  getStatus: (appointmentId) => api.get(`/appointments/${appointmentId}/status`),
  getMyAppointments: () => api.get('/appointments/my'),
  cancel: (appointmentId) => api.put(`/appointments/${appointmentId}/cancel`),
}

// ─── Video Call ─────────────────────────────────────────────────────────────
export const videoCallAPI = {
  getToken: (appointmentId) => api.get(`/video-call/token/${appointmentId}`),
}

export default api
