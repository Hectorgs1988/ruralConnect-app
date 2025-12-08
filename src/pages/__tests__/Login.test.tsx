import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Login from '../Login';

const mockLogin = vi.fn();

vi.mock('react-router-dom', () => ({
	useNavigate: () => vi.fn(),
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
});

