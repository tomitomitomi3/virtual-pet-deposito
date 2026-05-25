import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { 
  UserPlus, Trash2, ShieldCheck, Mail, Calendar, 
  ArrowLeft, Dog, LogOut, User, Loader2, X 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const UsersPage = () => {
  const { users, loading, createUser, deleteUser } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    role: 'deposito'
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const { user: currentUser, logout } = useAuthStore();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    
    const result = await createUser(formData);
    if (result.success) {
      setShowModal(false);
      setFormData({ nombre: '', apellido: '', email: '', password: '', role: 'deposito' });
    } else {
      setFormError(result.error);
    }
    setFormLoading(false);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) {
      await deleteUser(userId);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 font-body flex flex-col">
      <header className="bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-surface-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="bg-brand-500 p-2 rounded-xl"><Dog className="text-white w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-display font-bold text-gray-900 leading-tight">Virtual Pet</h1>
            <p className="text-xs text-brand-500 font-bold uppercase tracking-wider">Gestión de Usuarios</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900">{currentUser?.nombre} {currentUser?.apellido}</span>
            <span className="text-xs text-gray-400 capitalize">{currentUser?.role}</span>
          </div>
          <button onClick={logout} className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Equipo de Depósito</h2>
            <p className="text-gray-500">Administra los accesos del personal al tablero de pedidos.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-2xl hover:bg-brand-600 transition-all font-bold shadow-lg shadow-brand-200"
          >
            <UserPlus className="w-5 h-5" /> Nuevo Usuario
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Cargando personal...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
              <div 
                key={user.id} 
                className={`bg-white border p-6 rounded-3xl transition-all ${!user.activo ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:border-brand-100'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${user.activo ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'}`}>
                    <User className="w-6 h-6" />
                  </div>
                  {user.activo && (
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-gray-900">{user.nombre} {user.apellido}</h3>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" /> {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ShieldCheck className="w-4 h-4" /> 
                    <span className="capitalize">{user.role}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Registrado el {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>

                {!user.activo && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full uppercase tracking-wider">Desactivado</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-surface-100 flex justify-between items-center bg-surface-50/50">
              <h3 className="text-xl font-display font-bold text-gray-900">Nuevo Usuario</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-xl text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-8 space-y-5">
              {formError && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    placeholder="Ej: Juan"
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Apellido</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                    placeholder="Ej: Pérez"
                    value={formData.apellido}
                    onChange={e => setFormData({...formData, apellido: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Corporativo</label>
                <input
                  required
                  type="email"
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                  placeholder="juan@virtualpet.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Contraseña Temporal</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-4 bg-brand-500 text-white rounded-2xl font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {formLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {formLoading ? 'Creando...' : 'Dar de Alta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
