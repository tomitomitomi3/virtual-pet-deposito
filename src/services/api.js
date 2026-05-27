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
    // Si es 401 y no es la ruta de login, limpiar y redirigir
    // Esto evita recargas infinitas si las credenciales son incorrectas
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('vp_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
