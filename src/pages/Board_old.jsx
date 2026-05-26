//DEJE ESTE ANTES DE PUSHEAR
//BORRAR SI NO HAY ERRORES




import React, { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import api from '../services/api'
import useAuthStore from '../store/authStore'
import { LogOut, Package, Truck, Clock, Dog, MapPin, User, ChevronRight } from 'lucide-react'

const COLUMNS = {
  pendiente: { id: 'pendiente', title: 'Pendiente', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  preparado: { id: 'preparado', title: 'Preparado', icon: Package, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  despachado: { id: 'despachado', title: 'Despachado', icon: Truck, color: 'bg-green-100 text-green-700 border-green-200' },
}

const Board = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const { logout, user } = useAuthStore()

  const fetchOrders = async () => {
    try {
      const response = await api.get('/backoffice/orders')
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

const onDragEnd = async (result) => {
  const { destination, source, draggableId } = result

  // Sin destino — soltó fuera del tablero
  if (!destination) return

  // Mismo lugar exacto — no hacer nada
  if (
    destination.droppableId === source.droppableId &&
    destination.index === source.index
  ) return

  // Misma columna, distinto índice — solo reordenar visualmente, sin llamar al backend
  if (destination.droppableId === source.droppableId) {
    setOrders(prev => {
      const columnOrders = prev
        .filter(o => o.estado === source.droppableId)
        .sort((a, b) => a._index - b._index)

      const orderId = parseInt(draggableId)
      const reordered = [...columnOrders]
      const [moved] = reordered.splice(source.index, 1)
      reordered.splice(destination.index, 0, moved)

      const otherOrders = prev.filter(o => o.estado !== source.droppableId)
      return [...otherOrders, ...reordered]
    })
    return  // ← sale sin llamar al backend
  }

  // Columna distinta — llamar al backend para cambiar estado
  const orderId = parseInt(draggableId)
  const newState = destination.droppableId
  const previousOrders = [...orders]

  setOrders(orders.map(o => o.id === orderId ? { ...o, estado: newState } : o))

  try {
    await api.patch(`/backoffice/orders/${orderId}/estado`, { estado: newState })
  } catch (error) {
    console.error('Error updating order state:', error)
    alert(error.response?.data?.detail || 'No se pudo mover el pedido.')
    setOrders(previousOrders)
  }
}

  const getOrdersByColumn = (columnId) => {
    return orders.filter(o => o.estado === columnId)
  }

  if (loading) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center font-body">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
        <p className="text-gray-500 font-medium">Cargando tablero...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50 font-body flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-brand-500 p-2 rounded-xl">
            <Dog className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-gray-900 leading-tight">Virtual Pet</h1>
            <p className="text-xs text-brand-500 font-bold uppercase tracking-wider">Gestión de Depósito</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900">{user?.nombre} {user?.apellido}</span>
            <span className="text-xs text-gray-400 capitalize">{user?.role}</span>
          </div>
          <button 
            onClick={logout}
            className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors group"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kanban Board */}
        <main className={`flex-1 p-6 overflow-x-auto transition-all duration-300 ${selectedOrder ? 'mr-[400px]' : ''}`}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 min-h-full min-w-max">
              {Object.values(COLUMNS).map((column) => (
                <div key={column.id} className="w-80 flex flex-col">
                  {/* Column Header */}
                  <div className={`mb-4 p-3 rounded-2xl border ${column.color} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <column.icon className="w-4 h-4" />
                      <span className="font-bold text-sm uppercase tracking-wide">{column.title}</span>
                    </div>
                    <span className="bg-white/50 px-2 py-0.5 rounded-lg text-xs font-bold">
                      {getOrdersByColumn(column.id).length}
                    </span>
                  </div>

                  {/* Droppable Area */}
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
                          {getOrdersByColumn(column.id).map((order, index) => (
                            <Draggable key={order.id.toString()} draggableId={order.id.toString()} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedOrder(order)}
                                  className={`bg-white p-4 rounded-2xl shadow-sm border transition-all cursor-pointer ${
                                    selectedOrder?.id === order.id ? 'border-brand-500 ring-2 ring-brand-500/10' : 'border-surface-200 hover:border-brand-300'
                                  } ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-brand-500/20 rotate-2' : ''}`}
                                >
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
                                    <div className="flex items-start gap-2">
                                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                                      <span className="text-xs text-gray-500 leading-tight line-clamp-1">{order.direccion_entrega}</span>
                                    </div>
                                  </div>

                                  <div className="pt-3 border-t border-surface-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Productos</p>
                                    <div className="space-y-1">
                                      {order.items?.slice(0, 2).map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                          <span className="text-gray-600 line-clamp-1 flex-1 mr-2">
                                            {item.producto_nombre || 'Producto'}
                                          </span>
                                          <span className="text-gray-400 font-bold">x{item.cantidad}</span>
                                        </div>
                                      ))}
                                      {order.items?.length > 2 && (
                                        <p className="text-[10px] text-brand-500 font-bold mt-1">+{order.items.length - 2} productos más</p>
                                      )}
                                    </div>
                                    {/* Fecha */}
                                    <div className="pt-3 mt-3 border-t border-surface-100 flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-400 font-mono">
                                        {new Date(order.created_at).toLocaleDateString('es-AR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </main>

        {/* Order Detail Sidebar */}
        <aside 
          className={`fixed top-[73px] right-0 bottom-0 w-[400px] bg-white border-l border-surface-200 shadow-2xl transition-transform duration-300 z-20 overflow-y-auto ${
            selectedOrder ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedOrder && (
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Pedido #{selectedOrder.id.toString().padStart(4, '0')}</h2>
                  <p className="text-sm text-gray-400 font-mono">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-surface-100 rounded-xl text-gray-400 transition-colors"
                >
                  <LogOut className="w-5 h-5 rotate-180" />
                </button>
              </div>

              <div className="space-y-8">
                {/* Cliente */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Datos del Cliente
                  </h3>
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100">
                    <p className="font-bold text-gray-900">{selectedOrder.user?.nombre} {selectedOrder.user?.apellido}</p>
                    <p className="text-sm text-brand-600 font-medium mt-1">{selectedOrder.user?.email}</p>
                  </div>
                </section>

                {/* Entrega */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Dirección de Entrega
                  </h3>
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100 flex items-start gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Truck className="w-4 h-4 text-brand-500" />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedOrder.direccion_entrega}</p>
                  </div>
                </section>

                {/* Items */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5" /> Detalle de Productos
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-surface-100 rounded-2xl">
                        <div className="w-10 h-10 bg-surface-50 rounded-xl flex items-center justify-center font-bold text-brand-500 text-xs">
                          x{item.cantidad}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.producto_nombre || 'Producto'}</p>
                          <p className="text-xs text-gray-400 font-mono">${item.precio_unitario.toLocaleString()}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">${item.subtotal.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Resumen */}
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
      </div>
    </div>
  )
}

export default Board
