import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { resetPassword } from "@/api/auth";

const RecuperarContrasena = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!token) {
            setError("Enlace de recuperación inválido. Solicita uno nuevo.");
            return;
        }

        if (!password || password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (password !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            setLoading(true);
            await resetPassword(token, password);
            setSuccess("Contraseña restablecida correctamente. Ya puedes iniciar sesión.");
            setPassword("");
            setConfirm("");
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "No se pudo restablecer la contraseña.");
        } finally {
            setLoading(false);
        }
    };

    const goToLogin = () => navigate("/login", { replace: true });

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4">
            <h1 className="text-2xl font-semibold text-center mb-4">Restablecer contraseña</h1>

            {!token ? (
                <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm text-center">
                    <p className="mb-4 text-sm text-muted">
                        El enlace de recuperación no es válido o ha caducado.
                    </p>
                    <Button onClick={goToLogin} className="w-full">
                        Volver al login
                    </Button>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm space-y-3"
                >
                    <Input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Repite la nueva contraseña"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />

                    {error && (
                        <p className="text-red-600 text-sm mb-1">{error}</p>
                    )}

                    {success && (
                        <p className="text-green-600 text-sm mb-1">{success}</p>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Guardando..." : "Cambiar contraseña"}
                    </Button>

                    <button
                        type="button"
                        onClick={goToLogin}
                        className="block w-full text-center mt-2 text-gray-600 cursor-pointer hover:underline text-sm"
                    >
                        Volver al login
                    </button>
                </form>
            )}
        </div>
    );
};

export default RecuperarContrasena;