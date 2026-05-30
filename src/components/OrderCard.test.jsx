import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OrderCard from './OrderCard';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

// Mock de la información de la orden
const mockOrder = {
  id: 123,
  total: 5000,
  user: { nombre: 'Juan', apellido: 'Perez' },
  direccion_entrega: 'Calle Falsa 123',
  created_at: new Date().toISOString(),
  estado: 'pendiente'
};

const renderWithDnD = (ui) => {
  return render(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {ui}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

describe('OrderCard', () => {
  it('debe renderizar el nombre del cliente y el total', () => {
    renderWithDnD(<OrderCard order={mockOrder} index={0} onClick={() => {}} />);
    
    expect(screen.getByText(/Juan Perez/i)).toBeInTheDocument();
    expect(screen.getByText(/\$5\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Calle Falsa 123/i)).toBeInTheDocument();
  });

  it('debe mostrar el badge de REENVÍO si la orden lo requiere', () => {
    const reenvioOrder = { ...mockOrder, isReenvio: true };
    renderWithDnD(<OrderCard order={reenvioOrder} index={0} onClick={() => {}} />);
    
    expect(screen.getByText(/REENVÍO POR FALLA/i)).toBeInTheDocument();
  });

  it('debe mostrar el estado del transportista si está despachado', () => {
    const sentOrder = { ...mockOrder, estado: 'despachado' };
    renderWithDnD(
      <OrderCard 
        order={sentOrder} 
        index={0} 
        onClick={() => {}} 
      />
    );
    
    expect(screen.getByText(/EN MANOS DEL TRANSPORTISTA/i)).toBeInTheDocument();
  });

  it('debe mostrar el estado "Entregado" si la orden está en ese estado', () => {
    const deliveredOrder = { ...mockOrder, estado: 'entregado' };
    renderWithDnD(
      <OrderCard 
        order={deliveredOrder} 
        index={0} 
        onClick={() => {}} 
      />
    );
    
    expect(screen.getByText(/ENTREGADO/i)).toBeInTheDocument();
  });

  it('debe llamar a onClick cuando se hace clic', () => {
    const handleClick = vi.fn();
    renderWithDnD(<OrderCard order={mockOrder} index={0} onClick={handleClick} />);
    
    // Buscamos el elemento que tiene la clase cursor-pointer (el contenedor principal de la card)
    const card = screen.getByText(/Juan Perez/i).closest('.cursor-pointer');
    card.click();
    
    expect(handleClick).toHaveBeenCalledWith(mockOrder);
  });
});
