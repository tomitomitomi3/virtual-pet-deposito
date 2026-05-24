import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import useAuthStore from '../store/authStore';

// Mock de useNavigate
const mockedUsedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedUsedNavigate,
  };
});

// Mock del store
vi.mock('../store/authStore', () => ({
  default: vi.fn(),
}));

describe('Login Page', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
    });
  });

  it('debe renderizar correctamente los campos de email y password', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/ejemplo@correo.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar al Depósito/i })).toBeInTheDocument();
  });

  it('debe llamar a login con los datos ingresados', async () => {
    mockLogin.mockResolvedValue(true);
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/ejemplo@correo.com/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar al Depósito/i }));

    expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123');
  });

  it('debe mostrar mensaje de error si el login falla', () => {
    useAuthStore.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: 'Credenciales inválidas',
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
  });

  it('debe mostrar estado de carga mientras se procesa', () => {
    useAuthStore.mockReturnValue({
      login: mockLogin,
      loading: true,
      error: null,
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText(/Iniciando sesión.../i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
