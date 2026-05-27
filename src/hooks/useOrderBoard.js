  import { useState, useEffect, useCallback, useRef } from 'react';
   import api from '../services/api';

   const VALID_TRANSITIONS = {
     pendiente: ['en_preparacion'],
     en_preparacion: ['pendiente', 'preparado'],
     preparado: ['en_preparacion', 'despachado'],
     despachado: ['preparado', 'en_transito', 'entregado'],
     en_transito: ['preparado', 'entregado'],
     entregado: ['despachado', 'en_transito']
   };

   export const useOrderBoard = () => {
     const [orders, setOrders] = useState([]);
     const [loading, setLoading] = useState(true);
     const ws = useRef(null);

     const fetchOrders = useCallback(async () => {
       try {
         const response = await api.get('/backoffice/orders');
         setOrders(response.data);
       } catch (error) {
         console.error('Error fetching orders:', error);
       } finally {
         setLoading(false);
       }
     }, []);

     useEffect(() => {
       fetchOrders();

       let socket;
       let reconnectTimer;

       const connectWS = () => {
         const wsUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws') + '/backoffice/ws';
         console.log('Connecting to WS:', wsUrl);
         
         socket = new WebSocket(wsUrl);

         socket.onmessage = (event) => {
           try {
             const data = JSON.parse(event.data);
             if (data.type === 'order_created' || data.type === 'order_updated') {
               console.log('WS Update received:', data.order);

               if (data.type === 'order_created') {
                 const audio = new Audio('https://bigsoundbank.com/static/sounds/0926.mp3');
                 audio.play().catch(err => console.warn('Could not play notification sound (user interaction may be required):', err));
               }

               setOrders(prev => {
                 const index = prev.findIndex(o => o.id === data.order.id);
                 if (index !== -1) {
                   const newOrders = [...prev];
                   // PRESERVAR flags locales de simulación que no vienen del back
                   const existingOrder = prev[index];
                   newOrders[index] = {
                     ...data.order,
                     simulationFinished: existingOrder.simulationFinished,
                     isReenvio: existingOrder.isReenvio || data.order.estado === 'preparado' && existingOrder.estado === 'en_transito'
                   };
                   return newOrders;
                 }
                 return [data.order, ...prev];
               });
             }
           } catch (err) {
             console.error('Error parsing WS message:', err);
           }
         };

         socket.onopen = () => {
           console.log('WS Connected ✅');
         };

         socket.onclose = () => {
           console.log('WS Disconnected ❌. Reconnecting in 3s...');
           reconnectTimer = setTimeout(connectWS, 3000);
         };

         socket.onerror = (err) => {
           console.error('WS Error ⚠️:', err);
           socket.close();
         };
         
         ws.current = socket;
       };

       connectWS();

       return () => {
         if (reconnectTimer) clearTimeout(reconnectTimer);
         if (socket) {
           socket.onclose = null; // Evitar reconexión al desmontar
           socket.close();
         }
       };
     }, [fetchOrders]);

     const handleMove = async (result) => {
       const { destination, source, draggableId } = result;
       if (!destination) return;
       if (destination.droppableId === source.droppableId && destination.index === source.index) return;

       // Validación de negocio
       if (destination.droppableId !== source.droppableId) {
         const allowed = VALID_TRANSITIONS[source.droppableId] || [];
         if (!allowed.includes(destination.droppableId)) return;
       }

       const orderId = parseInt(draggableId);
       const prevOrders = [...orders];

       setOrders(prev => {
         // 1. Quitamos el item de su posición actual
         const newOrders = prev.filter(o => o.id !== orderId);
         const movedItem = prev.find(o => o.id === orderId);
         if (!movedItem) return prev;

         // 2. Actualizamos su estado
         const updatedItem = { ...movedItem, estado: destination.droppableId };

         // 3. Insertamos en el índice correcto dentro de la columna destino
         const itemsInDest = newOrders.filter(o => o.estado === destination.droppableId);
         
         let insertIndex;
         if (itemsInDest.length === 0) {
           insertIndex = newOrders.length;
         } else if (destination.index >= itemsInDest.length) {
           insertIndex = newOrders.lastIndexOf(itemsInDest[itemsInDest.length - 1]) + 1;
         } else {
           insertIndex = newOrders.indexOf(itemsInDest[destination.index]);
         }

         newOrders.splice(insertIndex === -1 ? newOrders.length : insertIndex, 0, updatedItem);
         return newOrders;
       });

       if (destination.droppableId !== source.droppableId) {
         try {
           await api.patch(`/backoffice/orders/${orderId}/estado`, { estado: destination.droppableId });
         } catch (error) {
           setOrders(prevOrders); // Rollback
         }
       }
     };

     return { orders, loading, handleMove, setOrders };
   };