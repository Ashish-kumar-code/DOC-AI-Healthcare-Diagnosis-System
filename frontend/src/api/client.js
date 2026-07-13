import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Performance timing
  config._startTime = Date.now()
  return config
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Handle responses: timing + 401 token refresh
api.interceptors.response.use(
  (res) => {
    if (import.meta.env.DEV && res.config._startTime) {
      const duration = Date.now() - res.config._startTime
      console.log(`[API] ${res.config.method?.toUpperCase()} ${res.config.url} — ${duration}ms`)
    }
    return res
  },
  async (err) => {
    const originalRequest = err.config

    // If 401 and we haven't already tried to refresh
    if (err.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if this IS the refresh request or login/register
      if (originalRequest.url?.includes('/auth/refresh') ||
          originalRequest.url?.includes('/auth/login') ||
          originalRequest.url?.includes('/auth/register')) {
        return Promise.reject(err)
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(err)
      }

      try {
        // Attempt to refresh the access token
        const response = await axios.post(`${API_BASE}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        })

        const newToken = response.data.access_token
        localStorage.setItem('access_token', newToken)

        // Process queued requests with new token
        processQueue(null, newToken)

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        // Refresh failed — force logout
        processQueue(refreshErr, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export const authApi = {
  register: (name, email, password, age, gender) =>
    api.post('/auth/register', { name, email, password, age, gender }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  profile: () =>
    api.get('/auth/profile'),
  refresh: () =>
    api.post('/auth/refresh'),
}

export const diagnosisApi = {
  textDiagnosis: (age, gender, symptom_text, duration_days, severity, temperature, pain_level) =>
    api.post('/diagnosis/text', { age, gender, symptom_text, duration_days, severity, temperature, pain_level }),
  imageDiagnosis: (formData) =>
    api.post('/diagnosis/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  multimodalDiagnosis: (formData) =>
    api.post('/diagnosis/multimodal', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: (page = 1, limit = 10) =>
    api.get('/diagnosis/history', { params: { page, limit } }),
  getHistoryDetail: (diagnosisId) =>
    api.get(`/diagnosis/history/${diagnosisId}`),
}

export const chatApi = {
  startChat: () =>
    api.post('/chat/start', {}),
  sendMessage: (sessionId, message) =>
    api.post('/chat/message', { session_id: sessionId, message }),
  getChatHistory: (page = 1, limit = 10) =>
    api.get('/chat/history', { params: { page, limit } }),
}

export const locationApi = {
  nearby: (latitude, longitude, type = 'hospital', radius = 5000) =>
    api.post('/location/nearby', { latitude, longitude, type, radius }),
  manualSearch: (query) =>
    api.post('/location/manual-search', { query }),
}

export const reportApi = {
  downloadPdf: (diagnosisId) =>
    api.get(`/report/${diagnosisId}/pdf`, { responseType: 'blob' }),
}

export const adminApi = {
  getModelStatus: () => api.get('/admin/models/status'),
  trainTextModel: (force = false) => api.post(`/admin/models/train/text?force=${force}`),
  trainImageModel: (epochs = 5) => api.post('/admin/models/train/image', { epochs }),
  trainAllModels: (epochs = 5) => api.post('/admin/models/train/all', { epochs }),
  getHealth: () => api.get('/admin/health'),
  getMetrics: () => api.get('/admin/metrics'),
  getUsers: (page = 1, limit = 10) => api.get(`/admin/users?page=${page}&limit=${limit}`),
  getUserDetail: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDiagnosisStats: () => api.get('/admin/diagnoses/stats'),
  getDbInfo: () => api.get('/admin/db/info'),
  getLogs: (lines = 100) => api.get(`/admin/logs?lines=${lines}`),
  getRoutes: () => api.get('/admin/routes'),
  getConfig: () => api.get('/admin/config'),
}

export default api
