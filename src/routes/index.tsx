// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom'
import Home from '../pages/Home'
import Login from '../pages/Login'
import RecuperarContrasena from '../pages/RecuperarContrasena'
import Inicio from '../pages/Inicio'
import ReservarEspacio from '../pages/ReservarEspacio'
import CrearReserva from '../pages/CrearReserva'
import CompartirCoche from '../pages/CompartirCoche'
import OfrecerViaje from '../pages/OfrecerViaje'
import PanelAdmin from '../pages/PanelAdmin'
import GestionSocio from '../pages/GestionSocio'
import GestionEventos from '../pages/GestionEventos'
import ResumenGeneral from '../pages/ResumenGeneral'
import AsociacionMosquitos from '../pages/AsociacionMosquitos'
import PrivateRoute, { RoleGuard } from "@/components/guards/PrivateRoute";

const router = createBrowserRouter([
    // públicas
    { path: "/", element: <Home /> },
    { path: "/login", element: <Login /> },
    { path: "/RecuperarContrasena", element: <RecuperarContrasena /> },

    // protegidas (cualquier usuario logeado)
    {path: "/inicio", element: (<PrivateRoute><Inicio /></PrivateRoute>),},
    {path: "/ReservarEspacio", element: (<PrivateRoute><ReservarEspacio /></PrivateRoute>),},
    {path: "/CrearReserva",element: (<PrivateRoute><CrearReserva /></PrivateRoute>),},
    { path: "/CompartirCoche",element: (<PrivateRoute><CompartirCoche /></PrivateRoute>),},
    {path: "/OfrecerViaje",element: (<PrivateRoute><OfrecerViaje /></PrivateRoute>),},

    // solo ADMIN
    {path: "/PanelAdmin",element: (<RoleGuard role="ADMIN"><PanelAdmin /></RoleGuard>),},
    {path: "/GestionSocio",element: (<RoleGuard role="ADMIN"><GestionSocio /></RoleGuard>),},
    {path: "/GestionEventos",element: (<RoleGuard role="ADMIN"><GestionEventos /></RoleGuard>),},
    {path: "/ResumenGeneral",element: (<RoleGuard role="ADMIN"><ResumenGeneral /></RoleGuard>),},

    // puedes dejar pública o también protegerla
    { path: "/AsociacionMosquitos", element: <AsociacionMosquitos /> },
]);

export default router;