import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const SIMULATION_CONFIG = {
  TRANSIT_TIME: 10000,   // 10s para pasar a tránsito
  DELIVERY_TIME: 20000,  // 20s para el desenlace final
  FAILURE_RATE: 0.3,     // 30% de probabilidad de error
  CHECK_INTERVAL: 1000   // Revisar cada segundo
};

export const useCourierSimulation = (orders, setOrders) => {
  // Guardamos cuándo entró cada pedido a la columna "despachado"
  const [dispatchedTimestamps, setDispatchedTimestamps] = useState({});
  const [now, setNow] = useState(Date.now());
  
  // Referencias para evitar reinicios de efectos y condiciones de carrera
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const processingIds = useRef(new Set());

  useEffect(() => {
    const nowTimestamp = Date.now();
    
    setDispatchedTimestamps(prev => {
      const newTimestamps = { ...prev };
      let hasChanges = false;

      orders.forEach(order => {
        // Escaneamos las órdenes para detectar cuáles están en 'despachado' 
        // pero aún no tienen un timestamp (acaban de llegar)
        if (order.estado === 'despachado' && !newTimestamps[order.id]) {
          newTimestamps[order.id] = nowTimestamp;
          hasChanges = true;
        }
        // Si el pedido salió de los estados de tránsito/despachado, limpiamos su timestamp
        // Mantenemos el timestamp si está en 'despachado' o 'en_transito'
        const isInSimulation = order.estado === 'despachado' || order.estado === 'en_transito';
        if (!isInSimulation && newTimestamps[order.id]) {
          delete newTimestamps[order.id];
          hasChanges = true;
        }
      });

      return hasChanges ? newTimestamps : prev;
    });
  }, [orders]);

  // Bucle de simulación
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      
      // Usamos forEach para que las promesas no bloqueen el bucle
      Object.entries(dispatchedTimestamps).forEach(async ([orderId, timestamp]) => {
        const id = parseInt(orderId);
        
        // Si ya estamos procesando un cambio para esta orden, saltar
        if (processingIds.current.has(id)) return;

        const order = ordersRef.current.find(o => o.id === id);
        if (!order || order.simulationFinished) return;

        const elapsed = currentTime - timestamp;

        // --- PASO A TRÁNSITO (A los 10 segundos) ---
        if (elapsed >= SIMULATION_CONFIG.TRANSIT_TIME && order.estado === 'despachado') {
          processingIds.current.add(id);
          console.log(`[Simulation] Pedido #${id} intentando pasar a en_transito...`);
          try {
            await api.patch(`/backoffice/orders/${id}/estado`, { estado: 'en_transito' });
            console.log(`[Simulation] Pedido #${id} pasó a en_transito en el backend`);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, estado: 'en_transito' } : o));
          } catch (e) {
            const errorMsg = e.response?.data?.detail || e.response?.data?.error || e.message;
            console.error(`[Simulation] Error en pedido #${id}:`, errorMsg);
            
            // Si hay error (especialmente 409), dejamos de simular este paso para este pedido
            setDispatchedTimestamps(prev => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
          } finally {
            processingIds.current.delete(id);
          }
        }

        // --- DESENLACE FINAL (A los 20 segundos) ---
        if (elapsed >= SIMULATION_CONFIG.DELIVERY_TIME && order.estado === 'en_transito') {
          processingIds.current.add(id);
          const isFailure = Math.random() < SIMULATION_CONFIG.FAILURE_RATE;
          const nextState = isFailure ? 'preparado' : 'entregado';
          console.log(`[Simulation] Pedido #${id} intentando pasar a ${nextState} (falla: ${isFailure})...`);

          try {
            // Persistir en el Back
            await api.patch(`/backoffice/orders/${id}/estado`, { estado: nextState });
            console.log(`[Simulation] Pedido #${id} persistido como ${nextState}`);
            
            // Actualizar UI localmente
            setOrders(prev => prev.map(o => o.id === id?{ 
                  ...o, 
                  estado: nextState, 
                  isReenvio: isFailure, // Si falló, le ponemos la etiqueta
                  simulationFinished: true 
               } : o));
       
              // 3. Limpiamos el timestamp para sacarlo de la simulación
              setDispatchedTimestamps(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
              });
          } catch (e) {
            const errorMsg = e.response?.data?.detail || e.response?.data?.error || e.message;
            console.error(`[Simulation] Error persistiendo pedido #${id}:`, errorMsg);
            
            // Si falla el desenlace, también lo sacamos para no loopear
            setDispatchedTimestamps(prev => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
          } finally {
            processingIds.current.delete(id);
          }
        }
      });
    }, SIMULATION_CONFIG.CHECK_INTERVAL);

    return () => clearInterval(timer);
  }, [dispatchedTimestamps, setOrders]); // Quitamos 'orders' de las dependencias para evitar reinicios constantes

  return { dispatchedTimestamps, now };
};