/**
 * Contexto de autenticación
 *
 * Guarda el usuario y el token de la sesión, y expone login, logout y el hook useAuth.
 * Al cargar la aplicación recupera la sesión guardada y valida el token con la API.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { authApi, almacenToken } from '../api/servicios';
import { reiniciarSocket } from '../hooks/useTiempoReal';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app se valida el token guardado contra el backend
  useEffect(() => {
    if (!almacenToken.obtener()) { setCargando(false); return; }
    authApi.perfil()
      .then((r) => setUsuario(r.usuario))
      .catch(() => almacenToken.borrar())
      .finally(() => setCargando(false));
  }, []);

  const cerrarSesionLocal = useCallback(() => {
    almacenToken.borrar();
    reiniciarSocket();
    setUsuario(null);
  }, []);

  useEffect(() => {
    const expirada = () => { cerrarSesionLocal(); toast.error('Su sesión expiró. Inicie sesión nuevamente.'); };
    window.addEventListener('smartpark:sesion-expirada', expirada);
    return () => window.removeEventListener('smartpark:sesion-expirada', expirada);
  }, [cerrarSesionLocal]);

  const iniciarSesion = useCallback(async (nombreUsuario, password) => {
    const r = await authApi.login(nombreUsuario, password);
    almacenToken.guardar(r.token);
    reiniciarSocket();
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try { await authApi.logout(); } catch { /* aunque falle, se cierra localmente */ }
    cerrarSesionLocal();
  }, [cerrarSesionLocal]);

  const valor = useMemo(() => ({
    usuario, cargando, iniciarSesion, cerrarSesion, esAdmin: usuario?.rol === 'ADMIN',
  }), [usuario, cargando, iniciarSesion, cerrarSesion]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
