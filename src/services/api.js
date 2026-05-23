/**
 * Cliente HTTP centralizado para comunicación con la API de Virtual Pet.
 * Adjunta el JWT automáticamente en cada request autenticado.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vp_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
