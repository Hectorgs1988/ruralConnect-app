// src/pages/Login.tsx
import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import RecoverPasswordModal from "@/components/ui/RecoverPasswordModal";
import { useAuth } from "@/context/AuthContext";

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4">
      <img src="src/assets/RuralConnect.png" alt="Logo" className="mb-1 w-44 h-44" />
      <h1 className="text-2xl font-semibold text-center mb-4">
        Bienvenido a Rural Connect <br />
      </h1>

      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
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

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <Button type="submit" className="w-full">Login</Button>

        <button
          type="button"
          onClick={() => setShowRecoverModal(true)}
          className="text-center mt-3 text-gray-600 cursor-pointer hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </form>

      {showRecoverModal && (
        <RecoverPasswordModal onClose={() => setShowRecoverModal(false)} />
      )}
    </div>
  );
}
