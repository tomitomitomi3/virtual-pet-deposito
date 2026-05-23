import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { Dog } from 'lucide-react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(email, password)
    if (success) {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 font-body">
      <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-surface-100">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-brand-500 p-2 rounded-xl">
            <Dog className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-display font-bold text-gray-900 tracking-tight">
            Virtual Pet <span className="text-brand-500 text-sm align-top">Deposito</span>
          </span>
        </div>

        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
          Gestión de Depósito
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Ingresá tus credenciales para gestionar los pedidos.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5 ml-1">Email</label>
            <input 
              type="email" 
              required
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:border-brand-500 transition-all text-sm"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5 ml-1">Contraseña</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:outline-none focus:border-brand-500 transition-all text-sm"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3.5 rounded-2xl font-bold text-base transition-all disabled:opacity-50 shadow-lg shadow-brand-500/20"
          >
            {loading ? 'Iniciando sesión...' : 'Entrar al Depósito'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-surface-100 text-center">
          <p className="text-xs text-gray-400">
            Solo personal autorizado. Si no tienes acceso, contacta al administrador.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
