import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "@/components/ui/button";
import { resetPassword } from "@/api/auth";

const PASSWORD_POLICY_HINT =
    "La contraseña debe tener al menos 10 caracteres e incluir letras, numeros y un caracter especial.";

type PasswordRule = {
    id: string;
    label: string;
    ok: boolean;
};

type PasswordStrength = {
    label: string;
    colorClass: string;
    barClass: string;
    percent: number;
};

const getPasswordRules = (value: string): PasswordRule[] => {
    return [
        {
            id: "length",
            label: "Minimo 10 caracteres",
            ok: value.length >= 10,
        },
        {
            id: "letter",
            label: "Al menos una letra",
            ok: /[A-Za-z]/.test(value),
        },
        {
            id: "number",
            label: "Al menos un numero",
            ok: /\d/.test(value),
        },
        {
            id: "special",
            label: "Al menos un caracter especial",
            ok: /[^A-Za-z0-9]/.test(value),
        },
    ];
};

const getPasswordStrength = (value: string): PasswordStrength => {
    if (!value) {
        return {
            label: "Sin definir",
            colorClass: "text-muted",
            barClass: "bg-borderSoft",
            percent: 0,
        };
    }

    const rules = getPasswordRules(value);
    const passed = rules.filter((rule) => rule.ok).length;

    if (passed <= 1) {
        return {
            label: "Debil",
            colorClass: "text-red-600",
            barClass: "bg-red-500",
            percent: 25,
        };
    }

    if (passed <= 3) {
        return {
            label: "Media",
            colorClass: "text-amber-600",
            barClass: "bg-amber-500",
            percent: 65,
        };
    }

    return {
        label: "Fuerte",
        colorClass: "text-green-700",
        barClass: "bg-green-600",
        percent: 100,
    };
};

const getPasswordPolicyError = (value: string): string | null => {
    const rules = getPasswordRules(value);
    if (!rules[0].ok) {
        return PASSWORD_POLICY_HINT;
    }
    if (!rules[1].ok) {
        return "La contraseña debe incluir al menos una letra.";
    }
    if (!rules[2].ok) {
        return "La contraseña debe incluir al menos un numero.";
    }
    if (!rules[3].ok) {
        return "La contraseña debe incluir al menos un caracter especial.";
    }
    return null;
};

const RecuperarContrasena = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const passwordRules = getPasswordRules(password);
    const passwordStrength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!token) {
            setError("Enlace de recuperación inválido. Solicita uno nuevo.");
            return;
        }

        const passwordError = getPasswordPolicyError(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (password !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            setLoading(true);
            await resetPassword(token, password);
            setSuccess("Contraseña guardada correctamente. Te redirigiremos al login.");
            setPassword("");
            setConfirm("");
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1200);
        } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "No se pudo restablecer la contraseña.");
        } finally {
            setLoading(false);
        }
    };

    const goToLogin = () => navigate("/login", { replace: true });

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4 py-6 sm:px-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-center mb-4">Crear o restablecer contraseña</h1>

            {!token ? (
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-md w-full max-w-md text-center">
                    <p className="mb-4 text-sm sm:text-base text-muted">
                        El enlace no es válido o ha caducado.
                    </p>
                    <Button onClick={goToLogin} className="w-full min-h-11 text-sm sm:text-base">
                        Volver al login
                    </Button>
                </div>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-5 sm:p-6 rounded-xl shadow-md w-full max-w-md space-y-3"
                >
                    <div className="w-full mb-4 relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-surfaceMuted border text-base border-borderSoft focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-md pr-20"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-2 px-2 flex items-center text-xs sm:text-sm text-muted hover:text-dark"
                        >
                            {showPassword ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>
                    <div className="-mt-2 mb-2">
                        <p className="text-xs sm:text-sm text-muted leading-relaxed mb-1">{PASSWORD_POLICY_HINT}</p>
                        <div className="mb-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted">Fortaleza</span>
                                <span className={passwordStrength.colorClass}>{passwordStrength.label}</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-surfaceMuted border border-borderSoft overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${passwordStrength.barClass}`}
                                    style={{ width: `${passwordStrength.percent}%` }}
                                />
                            </div>
                        </div>
                        <ul className="space-y-1 text-xs sm:text-sm">
                            {passwordRules.map((rule) => (
                                <li
                                    key={rule.id}
                                    className={rule.ok ? "text-green-700" : "text-muted"}
                                >
                                    {rule.ok ? "✓" : "○"} {rule.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full mb-4 relative">
                        <input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Repite la contraseña"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full px-4 py-3 bg-surfaceMuted border text-base border-borderSoft focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-md pr-20"
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm((prev) => !prev)}
                            className="absolute inset-y-0 right-2 px-2 flex items-center text-xs sm:text-sm text-muted hover:text-dark"
                        >
                            {showConfirm ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm mb-1">{error}</p>
                    )}

                    {success && (
                        <p className="text-green-600 text-sm mb-1">{success}</p>
                    )}

                    <Button type="submit" className="w-full min-h-11 text-sm sm:text-base" disabled={loading}>
                        {loading ? "Guardando..." : "Guardar contraseña"}
                    </Button>

                    <button
                        type="button"
                        onClick={goToLogin}
                        className="block w-full text-center mt-2 text-gray-600 cursor-pointer hover:underline text-sm min-h-11"
                    >
                        Volver al login
                    </button>
                </form>
            )}
        </div>
    );
};

export default RecuperarContrasena;