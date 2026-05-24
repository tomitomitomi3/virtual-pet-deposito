import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCourierSimulation } from './useCourierSimulation';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    patch: vi.fn(),
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

  it('debe registrar un timestamp cuando una orden entra en estado enviado', () => {
    const orders = [{ id: 1, estado: 'enviado' }];
    const setOrders = vi.fn();
    
    const { result, rerender } = renderHook(({ orders }) => useCourierSimulation(orders, setOrders), {
      initialProps: { orders }
    });

    expect(result.current.sentTimestamps[1]).toBeDefined();
    
    // Si cambia de estado, debe borrarse
    rerender({ orders: [{ id: 1, estado: 'entregado' }] });
    expect(result.current.sentTimestamps[1]).toBeUndefined();
  });

  it('debe avanzar el estado a entregado tras el tiempo configurado', async () => {
    const orders = [{ id: 1, estado: 'enviado' }];
    const setOrders = vi.fn();
    
    // Forzamos que no haya fallas para este test
    vi.spyOn(Math, 'random').mockReturnValue(1); // > 0.3 (failure rate)

    renderHook(() => useCourierSimulation(orders, setOrders));

    // Adelantamos el tiempo 21 segundos (config es 20s)
    await act(async () => {
      vi.advanceTimersByTime(21000);
    });

    expect(api.patch).toHaveBeenCalledWith('/backoffice/orders/1/estado', { estado: 'entregado' });
    expect(setOrders).toHaveBeenCalled();
  });

  it('debe marcar como reenvío si la simulación falla', async () => {
    const orders = [{ id: 1, estado: 'enviado' }];
    const setOrders = vi.fn();
    
    // Forzamos falla
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.3

    renderHook(() => useCourierSimulation(orders, setOrders));

    await act(async () => {
      vi.advanceTimersByTime(21000);
    });

    expect(api.patch).toHaveBeenCalledWith('/backoffice/orders/1/estado', { estado: 'preparado' });
    
    // Verificamos que se llame a setOrders con isReenvio: true
    const updateFn = setOrders.mock.calls[0][0];
    const newState = updateFn(orders);
    expect(newState[0].isReenvio).toBe(true);
    expect(newState[0].estado).toBe('preparado');
  });
});
