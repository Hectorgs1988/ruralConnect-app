import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';

type RecoverPasswordModalProps = {
    onClose: () => void;
};

const RecoverPasswordModal = ({ onClose }: RecoverPasswordModalProps) => {
    const [username, setUsername] = useState('');

    const handleRecover = () => {
    alert(`Se ha enviado un correo de recuperación a: ${username}`);
    onClose();
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
                        Introduce tu usuario para recuperar el acceso.
                    </p>
                </div>

                <label htmlFor="username" className="text-sm font-medium">
                    Usuario
                </label>
                <Input
                    id="username"
                    placeholder="Introduce tu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
