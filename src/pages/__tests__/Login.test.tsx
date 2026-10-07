import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import Login from '../Login';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();
const mockLocation = { state: null as { from?: string } | null };

vi.mock('react-router-dom', () => ({
	useNavigate: () => mockNavigate,
	useLocation: () => mockLocation,
}));

vi.mock('@/context/AuthContext', () => ({
	useAuth: () => ({
		login: mockLogin,
	}),
}));

describe('Login page', () => {
	beforeEach(() => {
		mockNavigate.mockClear();
		mockLogin.mockReset();
		mockLocation.state = null;
	});

	it('llama a login con usuario y contraseña al enviar el formulario', async () => {
		mockLogin.mockResolvedValueOnce(undefined);

		render(<Login />);

	fireEvent.change(screen.getByPlaceholderText('Usuario'), {
			target: { value: 'juan' },
		});
		fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
			target: { value: 'secreto' },
		});

		fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

		expect(mockLogin).toHaveBeenCalledWith('juan', 'secreto');
	});

		it('muestra un mensaje de error si login falla', async () => {
			mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'));

			render(<Login />);

			fireEvent.change(screen.getByPlaceholderText('Usuario'), {
				target: { value: 'juan' },
			});
			fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
				target: { value: 'secreto' },
			});

			fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

			// Esperamos a que React actualice el estado de error
			const errorMessage = await screen.findByText('Credenciales inválidas');
			expect(errorMessage).toBeInTheDocument();
		});

		it('redirige a /inicio cuando el login tiene éxito', async () => {
			mockLogin.mockResolvedValueOnce(undefined);

			render(<Login />);

			fireEvent.change(screen.getByPlaceholderText('Usuario'), {
				target: { value: 'juan' },
			});
			fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
				target: { value: 'secreto' },
			});

			fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith('/inicio', { replace: true });
			});
		});

		it('returns to the requested Caja path after successful login', async () => {
			mockLogin.mockResolvedValueOnce(undefined);
			mockLocation.state = { from: '/caja?turno=1#ticket' };

			render(<Login />);

			fireEvent.change(screen.getByPlaceholderText('Usuario'), {
				target: { value: 'juan' },
			});
			fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
				target: { value: 'secreto' },
			});
			fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith('/caja?turno=1#ticket', { replace: true });
			});
		});

		it('does not navigate to an external return path', async () => {
			mockLogin.mockResolvedValueOnce(undefined);
			mockLocation.state = { from: '//example.com/path' };

			render(<Login />);

			fireEvent.change(screen.getByPlaceholderText('Usuario'), {
				target: { value: 'juan' },
			});
			fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
				target: { value: 'secreto' },
			});
			fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }));

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith('/inicio', { replace: true });
			});
		});
});
