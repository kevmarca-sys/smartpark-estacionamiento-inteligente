/**
 * Componente raíz y enrutamiento
 *
 * Define las rutas públicas, las del administrador y las del guardia, cada grupo
 * protegido por rol. Las páginas se cargan de forma diferida (lazy loading).
 */

import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import RutaProtegida from './routes/RutaProtegida';
import AdminLayout from './layouts/AdminLayout';
import GuardiaLayout from './layouts/GuardiaLayout';
import { Cargando } from './components/ui';
import Login from './pages/auth/Login';

// Carga diferida: cada página se descarga solo cuando se necesita
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Espacios = lazy(() => import('./pages/admin/Espacios'));
const Sesiones = lazy(() => import('./pages/admin/Sesiones'));
const Clientes = lazy(() => import('./pages/admin/Clientes'));
const Tarifas = lazy(() => import('./pages/admin/Tarifas'));
const Reportes = lazy(() => import('./pages/admin/Reportes'));
const Auditoria = lazy(() => import('./pages/admin/Auditoria'));
const Usuarios = lazy(() => import('./pages/admin/Usuarios'));
const InicioGuardia = lazy(() => import('./pages/guardia/Inicio'));
const Entrada = lazy(() => import('./pages/guardia/Entrada'));
const Salida = lazy(() => import('./pages/guardia/Salida'));
const EspaciosGuardia = lazy(() => import('./pages/guardia/Espacios'));
const TicketsGuardia = lazy(() => import('./pages/guardia/Tickets'));
const MiTicket = lazy(() => import('./pages/publico/MiTicket'));
const AccesoDenegado = lazy(() => import('./pages/errores/AccesoDenegado'));
const SinConexion = lazy(() => import('./pages/errores/SinConexion'));
const NoEncontrado = lazy(() => import('./pages/errores/NoEncontrado'));

function Inicio() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Navigate to={usuario.rol === 'ADMIN' ? '/admin' : '/guardia'} replace />;
}

export default function App() {
  const navegar = useNavigate();
  useEffect(() => {
    const sinRed = () => { if (!navigator.onLine) navegar('/sin-conexion'); };
    window.addEventListener('smartpark:sin-conexion', sinRed);
    return () => window.removeEventListener('smartpark:sin-conexion', sinRed);
  }, [navegar]);

  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ticket/:codigo" element={<MiTicket />} />

        <Route element={<RutaProtegida roles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="espacios" element={<Espacios />} />
            <Route path="sesiones" element={<Sesiones />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="tarifas" element={<Tarifas />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="auditoria" element={<Auditoria />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Route>

        <Route element={<RutaProtegida roles={['GUARDIA', 'ADMIN']} />}>
          <Route path="/guardia" element={<GuardiaLayout />}>
            <Route index element={<InicioGuardia />} />
            <Route path="entrada" element={<Entrada />} />
            <Route path="salida" element={<Salida />} />
            <Route path="tickets" element={<TicketsGuardia />} />
            <Route path="espacios" element={<EspaciosGuardia />} />
          </Route>
        </Route>

        <Route path="/403" element={<AccesoDenegado />} />
        <Route path="/sin-conexion" element={<SinConexion />} />
        <Route path="*" element={<NoEncontrado />} />
      </Routes>
    </Suspense>
  );
}
