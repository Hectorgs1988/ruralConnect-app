// src/pages/Login.tsx
import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import RecoverPasswordModal from "@/components/ui/RecoverPasswordModal";
import { useAuth } from "@/context/AuthContext";
const bgHero = new URL("../assets/Campos.jpg", import.meta.url).href;
const logoRC = new URL("../assets/RuralConnect.png", import.meta.url).href;


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(username, password);
      navigate("/inicio", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Fondo de campos */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgHero})` }}
        aria-hidden="true"
      />
      {/* Capa blanca suavizada */}
      <div
        className="absolute inset-0 bg-white/65 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      {/* Contenido */}
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-surface/95 border border-borderSoft rounded-2xl shadow-soft px-6 py-6 space-y-4">
          <div className="flex justify-center">
            <img
              src={logoRC}
              alt="Rural Connect Burgos"
              className="w-[360px] max-w-[80vw] mb-2 select-none"
              draggable={false}
            />
          </div>

          <h1 className="text-xl font-semibold text-center text-dark">
            Bienvenido/a a Rural Connect
          </h1>

          <form onSubmit={handleLogin} className="space-y-2">
            <Input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="text-error text-sm">{error}</p>}

            <Button type="submit" className="w-full mt-1">
              Login
            </Button>

            <button
              type="button"
              onClick={() => setShowRecoverModal(true)}
              className="block w-full text-center mt-3 text-muted hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        </div>

        {showRecoverModal && (
          <RecoverPasswordModal onClose={() => setShowRecoverModal(false)} />
        )}
      </div>
    </div>
  );
}
