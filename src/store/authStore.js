import { create } from 'zustand'
import api from '../services/api'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('vp_user')) || null,
  token: localStorage.getItem('vp_token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, user } = response.data
      
      // Validar que el usuario sea admin o deposito
      if (user.role !== 'admin' && user.role !== 'deposito') {
        throw new Error('No tienes permisos para acceder al sistema del depósito.')
      }

      localStorage.setItem('vp_token', access_token)
      localStorage.setItem('vp_user', JSON.stringify(user))
      
      set({ token: access_token, user, loading: false })
      return true
    } catch (err) {
      set({ 
        error: err.message || err.response?.data?.detail || 'Error al iniciar sesión', 
        loading: false 
      })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('vp_token')
    localStorage.removeItem('vp_user')
    set({ user: null, token: null })
  },

  isLoggedIn: () => !!localStorage.getItem('vp_token')
}))

export default useAuthStore
