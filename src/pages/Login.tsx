import { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import RecoverPasswordModal from "@/components/ui/RecoverPasswordModal";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showRecoverModal, setShowRecoverModal] = useState(false);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "user" && password === "1234"){
      navigate("/Inicio");

    }else if (username === "admin" && password === "4321"){
      navigate('/PanelAdmin');
    }else{
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4">
      <img src="src/assets/susinosLogo.png" alt="Logo" className="mb-6 w-24 h-24" />
      <h1 className="text-2xl font-semibold text-center mb-4">
        Bienvenido a la peña <br /> Los Mosquitos
      </h1>

      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <Input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          //error={error}
        />

        <Input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          //error={error}
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <Button type="submit" className="w-full">Login</Button>

        <p onClick={() => setShowRecoverModal(true)} className="text-sm text-center mt-3 text-gray-600 cursor-pointer hover:underline">
          ¿Olvidaste tu contraseña?
        </p>
      </form>

      <p className="mt-10 text-sm text-gray-500">Peña Los Mosquitos - Susinos del Páramo</p>
      <p className="text-sm text-gray-500">© 2025 desde Susinos del Páramo con amor</p>

      {/* Modal para recuperar la contraseña*/}
      {showRecoverModal && (<RecoverPasswordModal onClose={() => setShowRecoverModal(false)} />)}
    </div>
  );
};

export default Login;
