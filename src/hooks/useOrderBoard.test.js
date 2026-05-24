import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOrderBoard } from './useOrderBoard';
import api from '../services/api';

// Mock de API
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockOrders = [
  { id: 1, estado: 'pendiente', user: { nombre: 'A', apellido: 'B' }, total: 100, created_at: new Date().toISOString() },
  { id: 2, estado: 'en_preparacion', user: { nombre: 'C', apellido: 'D' }, total: 200, created_at: new Date().toISOString() },
];

describe('useOrderBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe cargar las órdenes al inicializar', async () => {
    api.get.mockResolvedValue({ data: mockOrders });

    const { result } = renderHook(() => useOrderBoard());

    // El primer estado es loading: true
    expect(result.current.loading).toBe(true);

    // Esperamos a que se resuelva la promesa
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.orders).toEqual(mockOrders);
    expect(result.current.loading).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/backoffice/orders');
  });

  it('debe manejar errores al cargar órdenes', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.get.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useOrderBoard());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching orders:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('debe validar transiciones de estado correctamente', async () => {
    api.get.mockResolvedValue({ data: mockOrders });

    const { result } = renderHook(() => useOrderBoard());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Intentar mover de 'pendiente' a 'entregado' (inválido)
    const invalidResult = {
      destination: { droppableId: 'entregado', index: 0 },
      source: { droppableId: 'pendiente', index: 0 },
      draggableId: '1'
    };

    await act(async () => {
      await result.current.handleMove(invalidResult);
    });

    // No debería haber llamado a la API ni cambiado el estado local
    expect(api.patch).not.toHaveBeenCalled();
    expect(result.current.orders[0].estado).toBe('pendiente');

    // Intentar mover de 'pendiente' a 'en_preparacion' (válido)
    const validResult = {
      destination: { droppableId: 'en_preparacion', index: 1 },
      source: { droppableId: 'pendiente', index: 0 },
      draggableId: '1'
    };

    api.patch.mockResolvedValue({ data: {} });

    await act(async () => {
      await result.current.handleMove(validResult);
    });

    expect(api.patch).toHaveBeenCalledWith('/backoffice/orders/1/estado', { estado: 'en_preparacion' });
    expect(result.current.orders.find(o => o.id === 1).estado).toBe('en_preparacion');
  });
});
