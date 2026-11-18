/**
 * Ruta protegida
 *
 * Exige una sesión iniciada y uno de los roles permitidos; si no se cumple,
 * redirige al inicio de sesión o a la página 403.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cargando } from '../components/ui';

/** Protección de rutas en el frontend (el backend también valida cada permiso). */
export default function RutaProtegida({ roles }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();
  if (cargando) return <Cargando texto="Verificando sesión..." />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
