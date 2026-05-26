import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCourierSimulation } from './useCourierSimulation';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('useCourierSimulation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe registrar un timestamp cuando una orden entra en estado despachado y mantenerlo en tránsito', () => {
    const orders = [{ id: 1, estado: 'despachado' }];
    const setOrders = vi.fn();
    
    const { result, rerender } = renderHook(({ orders }) => useCourierSimulation(orders, setOrders), {
      initialProps: { orders }
    });

    expect(result.current.dispatchedTimestamps[1]).toBeDefined();
    const initialTimestamp = result.current.dispatchedTimestamps[1];
    
    // Si cambia a en_transito, debe MANTENERSE
    rerender({ orders: [{ id: 1, estado: 'en_transito' }] });
    expect(result.current.dispatchedTimestamps[1]).toBe(initialTimestamp);

    // Si cambia a entregado, debe borrarse (porque ya no está en el bucle de simulación activa)
    rerender({ orders: [{ id: 1, estado: 'entregado' }] });
    expect(result.current.dispatchedTimestamps[1]).toBeUndefined();
  });

  it('debe avanzar el estado de despachado -> en_transito -> entregado', async () => {
    let currentOrders = [{ id: 1, estado: 'despachado' }];
    const setOrders = vi.fn(updateFn => {
      if (typeof updateFn === 'function') {
        currentOrders = updateFn(currentOrders);
      }
    });
    
    vi.spyOn(Math, 'random').mockReturnValue(1); // No falla

    const { rerender } = renderHook(({ orders }) => useCourierSimulation(orders, setOrders), {
      initialProps: { orders: currentOrders }
    });

    // 1. A los 10s debe pasar a en_transito
    await act(async () => {
      vi.advanceTimersByTime(11000);
    });

    expect(api.patch).toHaveBeenCalledWith('/backoffice/orders/1/estado', { estado: 'en_transito' });
    
    // Simulamos que el componente se re-renderiza con la orden actualizada
    rerender({ orders: currentOrders });

    // 2. A los 20s (total) debe pasar a entregado
    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(api.patch).toHaveBeenCalledWith('/backoffice/orders/1/estado', { estado: 'entregado' });
    expect(currentOrders[0].estado).toBe('entregado');
    expect(currentOrders[0].simulationFinished).toBe(true);
  });

  it('debe marcar como reenvío si la simulación falla al final', async () => {
    let currentOrders = [{ id: 1, estado: 'en_transito' }]; // Empezamos ya en transito para simplificar
    const setOrders = vi.fn(updateFn => {
      if (typeof updateFn === 'function') {
        currentOrders = updateFn(currentOrders);
      }
    });
    
    // Forzamos falla
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.3

    const { result } = renderHook(() => useCourierSimulation(currentOrders, setOrders));
    
    // Inyectamos manualmente el timestamp como si ya hubiera pasado tiempo
    act(() => {
        result.current.dispatchedTimestamps[1] = Date.now() - 15000;
    });

    await act(async () => {
      vi.advanceTimersByTime(6000); // Total 21s
    });

    expect(api.patch).toHaveBeenCalledWith('/backoffice/orders/1/estado', { estado: 'preparado' });
    expect(currentOrders[0].isReenvio).toBe(true);
    expect(currentOrders[0].estado).toBe('preparado');
  });
});
