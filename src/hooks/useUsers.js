import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/users', { params: { role: 'deposito' } });
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.detail || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (userData) => {
    try {
      const response = await api.post('/auth/users', userData);
      setUsers(prev => [response.data, ...prev]);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Error al crear usuario' 
      };
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, activo: false } : u));
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Error al desactivar usuario' 
      };
    }
  };

  return { users, loading, error, fetchUsers, createUser, deleteUser };
};
