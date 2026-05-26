import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { User, MapPin, Clock, Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';

   const OrderCard = memo(({ order, index, isSelected, onClick, sentTimestamp, currentTime }) => {

     const getCourierStatus = () => {
       // Si no es enviado ni entregado, no mostramos nada
       if (order.estado !== 'enviado' && order.estado !== 'entregado') return null;
       
       // Si ya está entregado (y terminó la simulación), mostramos 'Entregado'
       if (order.estado === 'entregado') {
         return { 
           label: 'Entregado', 
           color: 'bg-green-50 text-green-700 border-green-100', 
           icon: <CheckCircle size={12}/> 
         };
       }

       if (!sentTimestamp) return null;
       
       // Usamos la prop inyectada, que es reactiva
       const elapsed = currentTime - sentTimestamp;
       
       if (elapsed < 10000) return { 
         label: 'En manos del transportista', 
         color: 'bg-amber-50 text-amber-700 border-amber-100', 
         icon: <Package size={12}/> 
       };
       if (elapsed < 20000) return { 
         label: 'En tránsito', 
         color: 'bg-blue-50 text-blue-700 border-blue-100', 
         icon: <Truck size={12}/> 
       };
       return { 
         label: 'Entregado', 
         color: 'bg-green-50 text-green-700 border-green-100', 
         icon: <CheckCircle size={12}/> 
       };
     };

     const courierStatus = getCourierStatus();

    return (
       <Draggable draggableId={order.id.toString()} index={index}>
         {(provided, snapshot) => (
           <div
             ref={provided.innerRef}
             {...provided.draggableProps}
             {...provided.dragHandleProps}
             onClick={() => onClick(order)}
             // Eliminamos transition-all y estilos manuales para evitar el bug del placeholder
             className={`bg-white p-4 rounded-2xl shadow-sm border cursor-pointer mb-3 select-none outline-none ${
               isSelected ? 'border-brand-500 ring-2 ring-brand-500/10' : 'border-surface-200 hover:border-brand-300'
             } ${snapshot.isDragging ? 'shadow-2xl z-50 ring-2 ring-brand-500/20' : ''}`}
             style={provided.draggableProps.style}
           >
             {/* Badge Reenvío */}
             {order.isReenvio && (
               <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
                 <AlertCircle size={12} /> REENVÍO POR FALLA
               </div>
             )}
             {/* Badge Simulación */}
             {courierStatus && (
               <div className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border ${courierStatus.color}`}>
                 {courierStatus.icon} {courierStatus.label.toUpperCase()}
               </div>
             )}
             <div className="flex justify-between items-start mb-3">
               <span className="text-xs font-mono font-bold text-gray-400">#{order.id.toString().padStart(4, '0')}</span>
               <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg">
                 ${order.total.toLocaleString('es-AR')}
               </span>
             </div>
             
             <div className="space-y-2 mb-4">
               <div className="flex items-start gap-2">
                 <User className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                 <span className="text-sm font-semibold text-gray-700">
                   {order.user?.nombre} {order.user?.apellido}
                 </span>
               </div>
               <div className="flex items-start gap-2 text-gray-500">
                 <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                 <span className="text-xs leading-tight line-clamp-1">{order.direccion_entrega}</span>
               </div>
             </div>

             <div className="pt-3 border-t border-surface-100 flex items-center gap-1.5 text-gray-400">
               <Clock className="w-3 h-3" />
               <span className="text-xs font-mono">
                 {new Date(order.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
               </span>
             </div>
           </div>
         )}
       </Draggable>
     );
   });

   export default OrderCard;