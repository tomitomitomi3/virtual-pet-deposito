  import { useState, useEffect, useCallback, useRef } from 'react';
   import api from '../services/api';

   const VALID_TRANSITIONS = {
     pendiente: ['en_preparacion'],
     en_preparacion: ['pendiente', 'preparado'],
     preparado: ['en_preparacion', 'enviado'],
     enviado: ['preparado', 'entregado'],
     entregado: ['enviado']
   };

   export const useOrderBoard = () => {
     const [orders, setOrders] = useState([]);
     const [loading, setLoading] = useState(true);
  

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

     useEffect(() => { fetchOrders(); }, [fetchOrders]);

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