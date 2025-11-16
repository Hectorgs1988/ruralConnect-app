import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import Input from "./input";
import { useAuth } from "@/context/AuthContext";
import { updateUser } from "@/api/users";

interface EditarSocioModalProps {
    socio: {
        id: string;
        nombre: string;
        email: string;
        telefono: string;
        rol: "Admin" | "Socio";
    };
    onClose: () => void;
    onUpdated?: () => void;
}

const EditarSocioModal: FC<EditarSocioModalProps> = ({ socio, onClose, onUpdated }) => {
    const { token } = useAuth();

    const inicialNombre = (() => {
        const parts = socio.nombre.trim().split(" ");
        if (parts.length === 0) return "";
        if (parts.length === 1) return parts[0];
        return parts[0];
    })();

    const inicialApellidos = (() => {
        const parts = socio.nombre.trim().split(" ");
        if (parts.length <= 1) return "";
        return parts.slice(1).join(" ");
    })();

    const [nombre, setNombre] = useState(inicialNombre);
    const [apellidos, setApellidos] = useState(inicialApellidos);
    const [email, setEmail] = useState(socio.email);
    const [telefono, setTelefono] = useState(socio.telefono);
    const [rol, setRol] = useState(socio.rol.toUpperCase());
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError("Debes iniciar sesion como admin.");
            return;
        }

        if (
            !nombre.trim() ||
            !apellidos.trim() ||
            !email.trim() ||
            !telefono.trim() ||
            !rol.trim()
        ) {
            setError("Rellena todos los campos obligatorios.");
            return;
        }

        const roleUpper = rol.trim().toUpperCase();
        if (roleUpper !== "ADMIN" && roleUpper !== "SOCIO") {
            setError("El rol debe ser ADMIN o SOCIO.");
            return;
        }

        const fullName = `${nombre.trim()} ${apellidos.trim()}`.trim();
        const phoneValue = telefono.trim() || null;

        try {
            setSubmitting(true);
            await updateUser(
                socio.id,
                {
                    email: email.trim(),
                    name: fullName,
                    phone: phoneValue,
                    role: roleUpper as "ADMIN" | "SOCIO",
                },
                token
            );

            if (onUpdated) onUpdated();
            onClose();
        } catch (err: any) {
            setError(err?.message ?? "Error al actualizar el socio");
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div
            className="rc-modal-overlay"
            onClick={onClose}
        >
            <div
                className="rc-modal-panel max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="mb-6">
                    <h2 className="rc-modal-title">Editar socio</h2>
                    <p className="rc-modal-subtitle">Modifica los datos del socio</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <p className="text-sm text-error mb-2">
                            {error}
                        </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Nombre *</label>
                            <Input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Nombre"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Apellidos *</label>
                            <Input
                                value={apellidos}
                                onChange={(e) => setApellidos(e.target.value)}
                                placeholder="Apellidos"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Telefono *</label>
                        <Input
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            placeholder="Telefono"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Rol *</label>
                        <Input
                            value={rol}
                            onChange={(e) => setRol(e.target.value)}
                            placeholder="Rol (ADMIN o SOCIO)"
                        />
                    </div>

                    <div className="rc-modal-footer">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="w-full md:w-auto rc-btn-secondary"
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="w-full md:w-auto rc-btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? "Guardando cambios..." : "Editar Socio"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditarSocioModal;

