import { describe, it, expect, vi, beforeEach } from 'vitest';
import useAuthStore from './authStore';
import api from '../services/api';

// Mock de API
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Resetear el store (Zustand persiste entre tests si no se maneja)
    useAuthStore.setState({ user: null, token: null, loading: false, error: null });
  });

  it('debe iniciar sesión correctamente para un admin', async () => {
    const mockUser = { id: 1, role: 'admin', email: 'admin@test.com' };
    const mockToken = 'fake-token';
    api.post.mockResolvedValue({ data: { access_token: mockToken, user: mockUser } });

    const success = await useAuthStore.getState().login('admin@test.com', 'password');

    expect(success).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().token).toBe(mockToken);
    expect(localStorage.getItem('vp_token')).toBe(mockToken);
    expect(JSON.parse(localStorage.getItem('vp_user'))).toEqual(mockUser);
  });

  it('debe fallar si el rol no es admin o deposito', async () => {
    const mockUser = { id: 1, role: 'user', email: 'user@test.com' };
    api.post.mockResolvedValue({ data: { access_token: 'token', user: mockUser } });

    const success = await useAuthStore.getState().login('user@test.com', 'password');

    expect(success).toBe(false);
    expect(useAuthStore.getState().error).toBe('No tienes permisos para acceder al sistema del depósito.');
    expect(useAuthStore.getState().user).toBe(null);
  });

  it('debe manejar errores de red o credenciales inválidas', async () => {
    api.post.mockRejectedValue({ response: { data: { detail: 'Credenciales inválidas' } } });

    const success = await useAuthStore.getState().login('wrong@test.com', 'wrong');

    expect(success).toBe(false);
    expect(useAuthStore.getState().error).toBe('Credenciales inválidas');
  });

  it('debe cerrar sesión correctamente', () => {
    useAuthStore.setState({ token: 'token', user: { role: 'admin' } });
    localStorage.setItem('vp_token', 'token');

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBe(null);
    expect(useAuthStore.getState().user).toBe(null);
    expect(localStorage.getItem('vp_token')).toBe(null);
  });
});
