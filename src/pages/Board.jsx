

import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { useOrderBoard } from '../hooks/useOrderBoard';
import { useCourierSimulation } from '../hooks/useCourierSimulation'; 
import OrderCard from '../components/OrderCard';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';
import { 
  LogOut, Package, Truck, Clock, Dog, Hammer, 
  History, CheckCircle, User, MapPin, Users 
} from 'lucide-react';

const COLUMNS = {
  pendiente: { id: 'pendiente', title: 'Pendiente', icon: Clock, color: 'bg-red-100 text-red-700 border-red-200' },
  en_preparacion: { id: 'en_preparacion', title: 'En Preparación', icon: Hammer, color: 'bg-amber-100 text-amber-700 border-amber-200'},
  preparado: { id: 'preparado', title: 'Preparado', icon: Package, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  enviado: { id: 'enviado', title: 'Enviado', icon: Truck, color: 'bg-green-100 text-green-700 border-green-200' },
};

const Board = () => {
  const { orders, loading, handleMove, setOrders } = useOrderBoard();
  const { sentTimestamps, now } = useCourierSimulation(orders, setOrders); 
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const { logout, user } = useAuthStore();

  const getHistoryOrders = () => orders.filter(o => o.estado === 'entregado');

  const onDragEnd = (result) => {
    handleMove(result);
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 font-body flex flex-col overflow-hidden">
      <header className="bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brand-500 p-2 rounded-xl"><Dog className="text-white w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-display font-bold text-gray-900 leading-tight">Virtual Pet</h1>
            <p className="text-xs text-brand-500 font-bold uppercase tracking-wider">Gestión de Depósito</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <Link to="/usuarios" className="flex items-center gap-2 px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl hover:bg-surface-100 transition-colors text-sm font-bold text-gray-600 shadow-sm">
              <Users className="w-4 h-4 text-brand-500" /> Usuarios
            </Link>
          )}
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors text-sm font-bold text-gray-600 shadow-sm">
            <History className="w-4 h-4" /> Historial
          </button>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">{user?.nombre} {user?.apellido}</span>
              <span className="text-xs text-gray-400 capitalize">{user?.role}</span>
            </div>
            <button onClick={logout} className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <main className={`flex-1 p-6 overflow-x-auto transition-all duration-300 ${selectedOrder ? 'mr-[400px]' : ''}`}>
            <div className="flex gap-6 min-h-full min-w-max">
              {Object.values(COLUMNS).map((column) => {
                const columnOrders = orders.filter(o => {
                  if (column.id === 'enviado') {
                    return o.estado === 'enviado' || (o.estado === 'entregado' && o.simulationFinished);
                  }
                  return o.estado === column.id;
                });

                return (
                  <div key={column.id} className="w-80 flex flex-col">
                    <div className={`mb-4 p-3 rounded-2xl border ${column.color} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <column.icon className="w-4 h-4" />
                        <span className="font-bold text-sm uppercase tracking-wide">{column.title}</span>
                      </div>
                      <span className="bg-white/50 px-2 py-0.5 rounded-lg text-xs font-bold">
                        {columnOrders.length}
                      </span>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`flex-1 rounded-3xl transition-colors p-2 ${
                            snapshot.isDraggingOver ? 'bg-brand-50/50 border-2 border-dashed border-brand-200' : 'bg-surface-100/50'
                          }`}
                        >
                          <div className="space-y-3">
                            {columnOrders.map((order, index) => (
                              <OrderCard 
                                key={order.id} 
                                order={order} 
                                index={index} 
                                isSelected={selectedOrder?.id === order.id}
                                onClick={setSelectedOrder}
                                sentTimestamp={sentTimestamps[order.id]}
                                currentTime={now}
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </main>

          <aside className={`fixed top-[73px] right-0 bottom-0 w-[400px] bg-white border-l border-surface-200 shadow-2xl transition-transform duration-300 z-20 overflow-y-auto ${selectedOrder ? 'translate-x-0' : 'translate-x-full'}`}>
            {selectedOrder && (
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Pedido #{selectedOrder.id.toString().padStart(4, '0')}</h2>
                    <p className="text-sm text-gray-400 font-mono">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-surface-100 rounded-xl text-gray-400 transition-colors">
                    <LogOut className="w-5 h-5 rotate-180" />
                  </button>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Datos del Cliente</h3>
                    <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100">
                      <p className="font-bold text-gray-900">{selectedOrder.user?.nombre} {selectedOrder.user?.apellido}</p>
                      <p className="text-sm text-brand-600 font-medium mt-1">{selectedOrder.user?.email}</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Detalle de Productos</h3>
                    <div className="space-y-3 mb-6">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-surface-100 rounded-2xl">
                          <div className="w-10 h-10 bg-surface-50 rounded-xl flex items-center justify-center font-bold text-brand-500 text-xs">x{item.cantidad}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.producto_nombre || 'Producto'}</p>
                            <p className="text-xs text-gray-400 font-mono">${item.precio_unitario.toLocaleString()}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">${item.subtotal.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>

                    <Droppable droppableId="entregado">
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`w-full p-6 border-2 border-dashed rounded-3xl transition-all duration-300 flex flex-col items-center gap-3 ${
                            snapshot.isDraggingOver ? 'bg-green-50 border-green-400 scale-105 shadow-lg text-green-600' : 'bg-surface-100/30 border-surface-200 text-gray-400'
                          }`}
                        >
                          <div className={`p-4 rounded-full ${snapshot.isDraggingOver ? 'bg-green-100 animate-bounce' : 'bg-white shadow-sm'}`}>
                            <CheckCircle className="w-8 h-8" />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-sm uppercase tracking-wider">Finalizar Envío</p>
                            <p className="text-[10px] font-medium opacity-60">Suelta aquí para archivar en el historial</p>
                          </div>
                          <div className="hidden">{provided.placeholder}</div>
                        </div>
                      )}
                    </Droppable>
                  </section>

                  <section className="pt-6 border-t border-surface-200">
                    <div className="flex justify-between items-center text-xl">
                      <span className="font-display font-bold text-gray-900">Total</span>
                      <span className="font-display font-bold text-brand-500">${selectedOrder.total.toLocaleString('es-AR')}</span>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </aside>
        </DragDropContext>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm">
          <div className="w-[500px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-surface-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-brand-500" />
                <h2 className="text-xl font-bold text-gray-900">Historial de Envíos</h2>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-surface-100 rounded-lg">
                <LogOut className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {getHistoryOrders().length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No hay pedidos entregados aún.</p>
                </div>
              ) : (
                getHistoryOrders().map(order => (
                  <div key={order.id} className="p-4 border border-surface-100 rounded-2xl bg-surface-50/50">
                    <div className="flex justify-between mb-2">
                      <span className="font-mono font-bold text-xs">#{order.id.toString().padStart(4, '0')}</span>
                      <span className="text-xs font-bold text-green-600">Entregado</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{order.user?.nombre} {order.user?.apellido}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.direccion_entrega}</p>
                    <div className="mt-3 pt-3 border-t border-surface-100 flex justify-between items-center text-xs">
                      <span className="text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                      <span className="font-bold text-gray-900">${order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;>
                      <span className="font-bold text-gray-900">${order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;