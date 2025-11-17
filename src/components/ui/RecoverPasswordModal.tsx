import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { forgotPassword } from '@/api/auth';

type RecoverPasswordModalProps = {
    onClose: () => void;
};

const RecoverPasswordModal = ({ onClose }: RecoverPasswordModalProps) => {
    const [email, setEmail] = useState('');

    const handleRecover = async () => {
        if (!email.trim()) return;
        try {
            await forgotPassword(email.trim());
            alert('Si el correo existe, recibirás un correo de recuperación.');
            onClose();
        } catch (e) {
            console.error(e);
            alert('Ha ocurrido un error al solicitar la recuperación de contraseña.');
        }
    };

    return (
        <div
            className="rc-modal-overlay"
            onClick={onClose}
        >
            <div
                className="rc-modal-panel max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    onClick={onClose}
                    aria-label="Cerrar modal"
                >
                    ✕
                </button>

                <div className="mb-4 text-center">
                    <h2 className="rc-modal-title">Recuperar contraseña</h2>
                    <p className="rc-modal-subtitle">
                        Introduce tu correo electrónico para recuperar el acceso.
                    </p>
                </div>

                <label htmlFor="email" className="text-sm font-medium">
                    Correo electrónico
                </label>
                <Input
                    id="email"
                    placeholder="tu-correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <div className="rc-modal-footer">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="w-full md:w-auto rc-btn-secondary"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleRecover}
                        className="w-full md:w-auto rc-btn-primary"
                    >
                        Recuperar contraseña
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RecoverPasswordModal;
