import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import Login from '../Login';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
	useNavigate: () => mockNavigate,
}));

vi.mock('@/context/AuthContext', () => ({
	useAuth: () => ({
		login: mockLogin,
	}),
}));

describe('Login page', () => {
	it('llama a login con usuario y contraseña al enviar el formulario', async () => {
		mockLogin.mockResolvedValueOnce(undefined);

		render(<Login />);

	fireEvent.change(screen.getByPlaceholderText('Usuario'), {
			target: { value: 'juan' },
		});
		fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
			target: { value: 'secreto' },
		});

		fireEvent.submit(screen.getByRole('button', { name: /login/i }));

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

			fireEvent.submit(screen.getByRole('button', { name: /login/i }));

			// Esperamos a que React actualice el estado de error
			const errorMessage = await screen.findByText('Credenciales inválidas');
			expect(errorMessage).toBeInTheDocument();
		});

		it('redirige a /inicio cuando el login tiene éxito', async () => {
			mockLogin.mockResolvedValueOnce(undefined);
			mockNavigate.mockClear();

			render(<Login />);

			fireEvent.change(screen.getByPlaceholderText('Usuario'), {
				target: { value: 'juan' },
			});
			fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
				target: { value: 'secreto' },
			});

			fireEvent.submit(screen.getByRole('button', { name: /login/i }));

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith('/inicio', { replace: true });
			});
		});
});

