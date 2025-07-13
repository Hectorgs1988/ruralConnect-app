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
import NuevoSocio from '../pages/NuevoSocio'
import DetalleSocio from '../pages/DetalleSocio'
const router = createBrowserRouter([
{
    path: '/',
    element: <Home />,
},
{
    path: '/login',
    element: <Login />,
},
{
    path: '/RecuperarContrasena',
    element: <RecuperarContrasena />,
},
{
    path: '/inicio',
    element: <Inicio />,
},
{
    path: '/ReservarEspacio',
    element: <ReservarEspacio />
},
{
    path: '/CrearReserva',
    element: <CrearReserva />
},
{
    path: '/CompartirCoche',
    element: <CompartirCoche />
},
{
    path: '/OfrecerViaje',
    element: <OfrecerViaje />
},
{
    path: '/PanelAdmin',
    element: <PanelAdmin />
},
{
    path: '/NuevoSocio',
    element: <NuevoSocio />
},
{
    path: '/DetalleSocio',
    element: <DetalleSocio />
}

])
export default router