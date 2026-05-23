import { useState, useEffect } from 'react';
import api from '../services/api';

const SIMULATION_CONFIG = {
  TRANSIT_TIME: 10000,   // 10s para pasar a tránsito
  DELIVERY_TIME: 20000,  // 20s para el desenlace final
  FAILURE_RATE: 0.3,     // 30% de probabilidad de error
  CHECK_INTERVAL: 1000   // Revisar cada segundo
};

export const useCourierSimulation = (orders, setOrders) => {
  // Guardamos cuándo entró cada pedido a la columna "enviado"
  const [sentTimestamps, setSentTimestamps] = useState({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Escaneamos las órdenes para detectar cuáles están en 'enviado' 
    // pero aún no tienen un timestamp (acaban de llegar)
    const now = Date.now();
    const newTimestamps = { ...sentTimestamps };
    let hasChanges = false;

    orders.forEach(order => {
      if (order.estado === 'enviado' && !newTimestamps[order.id]) {
        newTimestamps[order.id] = now;
        hasChanges = true;
      }
      // Si el pedido salió de 'enviado', limpiamos su timestamp
      if (order.estado !== 'enviado' && newTimestamps[order.id]) {
        delete newTimestamps[order.id];
        hasChanges = true;
      }
    });

    if (hasChanges) setSentTimestamps(newTimestamps);
  }, [orders]);

  // Bucle de simulación
  useEffect(() => {
    const timer = setInterval(async () => {
      const currentTime = Date.now();
      setNow(currentTime); // <--- Esto dispara el re-renderizado cada segundo
      
      for (const [orderId, timestamp] of Object.entries(sentTimestamps)) {
        const elapsed = currentTime - timestamp;
        const id = parseInt(orderId);
        const order = orders.find(o => o.id === id);

        if (!order || order.simulationFinished) continue;

        // --- DESENLACE FINAL (A los 20 segundos) ---
        if (elapsed >= SIMULATION_CONFIG.DELIVERY_TIME) {
          const isFailure = Math.random() < SIMULATION_CONFIG.FAILURE_RATE;
          const nextState = isFailure ? 'preparado' : 'entregado';

          try {
            // Persistir en el Back
            await api.patch(`/backoffice/orders/${id}/estado`, { estado: nextState });
            
            // Actualizar UI localmente
            setOrders(prev => prev.map(o => o.id === id?{ 
                  ...o, 
                  estado: nextState, 
                  isReenvio: isFailure, // Si falló, le ponemos la etiqueta
                  simulationFinished: true 
               } : o));
       
              // 3. Limpiamos el timer
              setSentTimestamps(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
              });
          } catch (e) {
          console.error(`Error persistiendo pedido #${id}:`, e); }
        }
      }
    }, SIMULATION_CONFIG.CHECK_INTERVAL);

    return () => clearInterval(timer);
  }, [sentTimestamps, orders, setOrders]);

  return { sentTimestamps, now };
};