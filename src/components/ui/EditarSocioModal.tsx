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
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center px-4">
            <div className="bg-[#FAFAF0] rounded-xl p-6 md:p-8 w-full max-w-2xl relative shadow-lg">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-6 text-gray-500 hover:text-black text-xl font-semibold"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-1">Editar socio</h2>
                <p className="text-sm text-gray-600 mb-6">Modifica los datos del socio</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

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

                    <Button type="submit" className="w-full mt-4" disabled={submitting}>
                        {submitting ? "Guardando cambios..." : "Editar Socio"}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default EditarSocioModal;

