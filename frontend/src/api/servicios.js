import http, { API_URL, almacenToken } from './http';

const datos = (p) => p.then((r) => r.data);

export const authApi = {
  login: (usuario, password) => datos(http.post('/auth/login', { usuario, password })),
  perfil: () => datos(http.get('/auth/perfil')),
  logout: () => datos(http.post('/auth/logout')),
};

export const espaciosApi = {
  listar: (params) => datos(http.get('/espacios', { params })),
  mapa: () => datos(http.get('/espacios/mapa')),
  crear: (body) => datos(http.post('/espacios', body)),
  actualizar: (id, body) => datos(http.put(`/espacios/${id}`, body)),
  cambiarEstado: (id, body) => datos(http.patch(`/espacios/${id}/estado`, body)),
  eliminar: (id) => datos(http.delete(`/espacios/${id}`)),
};

export const sesionesApi = {
  listar: (params) => datos(http.get('/sesiones', { params })),
  entrada: (body) => datos(http.post('/sesiones/entrada', body)),
  consultarCobro: (codigo) => datos(http.get(`/sesiones/${encodeURIComponent(codigo)}/cobro`)),
  salida: (codigo, body) => datos(http.post(`/sesiones/${encodeURIComponent(codigo)}/salida`, body)),
  anular: (codigo, motivo) => datos(http.post(`/sesiones/${encodeURIComponent(codigo)}/anular`, { motivo })),
};

export const vehiculosApi = {
  listar: (params) => datos(http.get('/vehiculos', { params })),
  detalle: (placa) => datos(http.get(`/vehiculos/${encodeURIComponent(placa)}`)),
  actualizar: (id, body) => datos(http.patch(`/vehiculos/${id}`, body)),
};

export const clientesApi = {
  listar: (params) => datos(http.get('/clientes', { params })),
  crear: (body) => datos(http.post('/clientes', body)),
  actualizar: (id, body) => datos(http.patch(`/clientes/${id}`, body)),
  eliminar: (id) => datos(http.delete(`/clientes/${id}`)),
};

export const tarifasApi = {
  obtener: () => datos(http.get('/tarifas')),
  actualizarTarifa: (tipo, body) => datos(http.put(`/tarifas/${tipo}`, body)),
  actualizarRegla: (codigo, body) => datos(http.put(`/tarifas/reglas/${codigo}`, body)),
  simular: (body) => datos(http.post('/tarifas/simular', body)),
};

export const reportesApi = {
  dashboard: () => datos(http.get('/reportes/dashboard')),
  resumen: (params) => datos(http.get('/reportes/resumen', { params })),
};

export const auditoriaApi = { listar: (params) => datos(http.get('/auditoria', { params })) };

export const usuariosApi = {
  listar: (params) => datos(http.get('/usuarios', { params })),
  crear: (body) => datos(http.post('/usuarios', body)),
  actualizar: (id, body) => datos(http.patch(`/usuarios/${id}`, body)),
};

export const lprApi = {
  estado: () => datos(http.get('/lpr/estado')),
  leer: (archivo, modo) => {
    const form = new FormData();
    form.append('imagen', archivo, 'placa.jpg');
    return datos(http.post('/lpr/leer', form, { params: modo ? { modo } : undefined }));
  },
};

export const publicoApi = { ticket: (codigo) => datos(http.get(`/publico/tickets/${encodeURIComponent(codigo)}`)) };

/** Descarga un PDF protegido (con token) y lo abre en una pestaña nueva. */
export async function abrirPdf(ruta, params) {
  const r = await http.get(ruta, { params, responseType: 'blob' });
  const url = URL.createObjectURL(r.data);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export const urlComprobantePublico = (codigo) => `${API_URL}/api/publico/tickets/${codigo}/comprobante`;
export { almacenToken };
