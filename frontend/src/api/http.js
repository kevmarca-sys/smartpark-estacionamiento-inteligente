/**
 * Cliente HTTP (axios)
 *
 * Instancia única para consumir la API REST: agrega el token JWT a cada petición y
 * normaliza los errores (sin conexión, validación, sesión expirada).
 */

import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const CLAVE_TOKEN = 'smartpark_token';

export const almacenToken = {
  obtener: () => { try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; } },
  guardar: (t) => { try { localStorage.setItem(CLAVE_TOKEN, t); } catch { /* sin almacenamiento */ } },
  borrar: () => { try { localStorage.removeItem(CLAVE_TOKEN); } catch { /* sin almacenamiento */ } },
};

const http = axios.create({ baseURL: `${API_URL}/api`, timeout: 20000 });

// Adjunta el token JWT a cada petición.
http.interceptors.request.use((config) => {
  const token = almacenToken.obtener();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normaliza los errores para mostrarlos de forma comprensible al usuario.
http.interceptors.response.use(
  (r) => r,
  (error) => {
    if (!error.response) {
      error.sinConexion = true;
      error.mensaje = 'No hay conexión con el servidor. Verifique su red e intente nuevamente.';
      window.dispatchEvent(new CustomEvent('smartpark:sin-conexion'));
    } else {
      const datos = error.response.data?.error || {};
      error.status = error.response.status;
      error.codigo = datos.codigo;
      error.mensaje = datos.mensaje || 'Ocurrió un error inesperado';
      error.detalles = datos.detalles || [];
      if (error.status === 401 && almacenToken.obtener()) {
        window.dispatchEvent(new CustomEvent('smartpark:sesion-expirada'));
      }
    }
    return Promise.reject(error);
  },
);

/** Convierte los detalles de validación del backend en { campo: mensaje } para los formularios. */
export function erroresPorCampo(error) {
  const r = {};
  (error?.detalles || []).forEach((d) => { if (!r[d.campo]) r[d.campo] = d.mensaje; });
  return r;
}

export default http;
