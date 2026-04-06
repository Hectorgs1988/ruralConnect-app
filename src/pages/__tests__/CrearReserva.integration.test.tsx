import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import CrearReserva from '../CrearReserva';
import type { Espacio } from '@/types/Espacio';

const mockListReservas = vi.fn();
const mockCreateReserva = vi.fn();
const mockUpdateReserva = vi.fn();

vi.mock('@/api/reservas', () => ({
  __esModule: true,
  listReservas: (...args: any[]) => mockListReservas(...args),
  createReserva: (...args: any[]) => mockCreateReserva(...args),
  updateReserva: (...args: any[]) => mockUpdateReserva(...args),
}));

vi.mock('@/context/AuthContext', () => ({
  __esModule: true,
  useAuth: () => ({
    token: 'fake-token',
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'SOCIO',
    },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('CrearReserva page (componente / integración)', () => {
  it('muestra datos del espacio y el mensaje de que no hay reservas activas del usuario', async () => {
    mockListReservas.mockResolvedValue([]);

    const espacio: Espacio = {
      id: 'esp-1',
      nombre: 'Sala de reuniones',
      tipo: 'SALA',
      aforo: 10,
      descripcion: 'Sala para pruebas',
    };

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/reservas/crear',
            state: { espacio },
          } as any,
        ]}
      >
        <Routes>
          <Route path="/reservas/crear" element={<CrearReserva />} />
        </Routes>
      </MemoryRouter>
    );

    // Título principal de la página
    expect(await screen.findByText('Reserva de espacios')).toBeInTheDocument();

    // Nombre del espacio recibido por location.state (puede aparecer en varios sitios)
    const nombreEspacioNodes = screen.getAllByText('Sala de reuniones');
    expect(nombreEspacioNodes.length).toBeGreaterThanOrEqual(1);

    // Tras cargar las reservas, muestra el mensaje de que no hay reservas activas del usuario
    const noReservasText = await screen.findByText(
      'No tienes reservas activas para este espacio.'
    );
    expect(noReservasText).toBeInTheDocument();

    // La función listReservas se ha llamado al menos una vez con el espacioId correcto
    await waitFor(() => {
      expect(mockListReservas).toHaveBeenCalled();
    });

    const calledWithEspacio = mockListReservas.mock.calls.some((call) => {
      const params = call[0];
      return params && params.espacioId === 'esp-1';
    });

    expect(calledWithEspacio).toBe(true);
  });

  it('muestra el nombre del usuario que ocupa una reserva del día', async () => {
    mockListReservas.mockResolvedValue([
      {
        id: 'res-1',
        usuarioId: 'user-2',
        espacioId: 'esp-1',
        inicio: new Date('2026-04-10T10:00:00.000Z').toISOString(),
        fin: new Date('2026-04-10T11:00:00.000Z').toISOString(),
        estado: 'CONFIRMADA',
        usuario: { id: 'user-2', name: 'Hector' },
      },
    ]);

    const espacio: Espacio = {
      id: 'esp-1',
      nombre: 'Sala de reuniones',
      tipo: 'SALA',
      aforo: 10,
      descripcion: 'Sala para pruebas',
    };

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/reservas/crear',
            state: { espacio },
          } as any,
        ]}
      >
        <Routes>
          <Route path="/reservas/crear" element={<CrearReserva />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Reserva de espacios')).toBeInTheDocument();

    const dayButton = await screen.findByRole('button', { name: '10' });
    fireEvent.click(dayButton);

    expect(await screen.findByText(/Reservado por/i)).toBeInTheDocument();
    expect(await screen.findByText('Hector')).toBeInTheDocument();
  });
});

