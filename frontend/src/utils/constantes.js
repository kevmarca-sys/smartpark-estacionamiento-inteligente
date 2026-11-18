/**
 * Constantes y validaciones compartidas
 *
 * Tipos de vehículo, estados, nombres de acciones de auditoría y validaciones
 * de placa y cédula ecuatorianas (las mismas reglas que aplica el backend).
 */

export const TIPOS_VEHICULO = [
  { valor: 'AUTO', texto: 'Auto' },
  { valor: 'MOTO', texto: 'Moto' },
  { valor: 'DISCAPACIDAD', texto: 'Discapacidad' },
];

export const textoTipo = (t) => TIPOS_VEHICULO.find((x) => x.valor === t)?.texto || t;

export const ESTADOS_ESPACIO = {
  LIBRE: { texto: 'Libre', color: 'verde' },
  OCUPADO: { texto: 'Ocupado', color: 'rojo' },
  INHABILITADO: { texto: 'Inhabilitado', color: 'gris' },
};

export const ESTADOS_SESION = {
  ABIERTA: { texto: 'Abierta', color: 'azul' },
  CERRADA: { texto: 'Cerrada', color: 'verde' },
  ANULADA: { texto: 'Anulada', color: 'gris' },
};

export const ACCIONES_AUDITORIA = {
  INICIO_SESION: { texto: 'Inicio de sesión', color: 'azul' },
  CIERRE_SESION: { texto: 'Cierre de sesión', color: 'gris' },
  LOGIN_FALLIDO: { texto: 'Login fallido', color: 'rojo' },
  REGISTRAR_ENTRADA: { texto: 'Entrada', color: 'verde' },
  REGISTRAR_SALIDA: { texto: 'Salida y cobro', color: 'azul' },
  ANULAR_SESION: { texto: 'Anulación', color: 'rojo' },
  LECTURA_PLACA: { texto: 'Lectura LPR', color: 'gris' },
  CAMBIAR_TARIFA: { texto: 'Cambio de tarifa', color: 'ambar' },
  CAMBIAR_REGLA_TARIFA: { texto: 'Cambio de regla', color: 'ambar' },
  CREAR_ESPACIO: { texto: 'Crear espacio', color: 'verde' },
  ACTUALIZAR_ESPACIO: { texto: 'Editar espacio', color: 'ambar' },
  INHABILITAR_ESPACIO: { texto: 'Inhabilitar espacio', color: 'rojo' },
  HABILITAR_ESPACIO: { texto: 'Habilitar espacio', color: 'verde' },
  ELIMINAR_ESPACIO: { texto: 'Eliminar espacio', color: 'rojo' },
  CREAR_CLIENTE: { texto: 'Registrar cliente', color: 'verde' },
  ACTUALIZAR_CLIENTE: { texto: 'Editar cliente', color: 'ambar' },
  ELIMINAR_CLIENTE: { texto: 'Eliminar cliente', color: 'rojo' },
  CREAR_VEHICULO: { texto: 'Registrar vehículo', color: 'verde' },
  ACTUALIZAR_VEHICULO: { texto: 'Editar vehículo', color: 'ambar' },
  CREAR_USUARIO: { texto: 'Crear usuario', color: 'verde' },
  ACTUALIZAR_USUARIO: { texto: 'Editar usuario', color: 'ambar' },
  EXPORTAR_REPORTE: { texto: 'Exportar reporte', color: 'gris' },
  CARGA_INICIAL: { texto: 'Carga inicial', color: 'gris' },
};

/** Placa ecuatoriana: autos ABC-1234 / ABC-123, motos AB123C */
export function normalizarPlaca(texto) {
  const limpia = String(texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^[A-Z]{3}\d{3,4}$/.test(limpia)) return `${limpia.slice(0, 3)}-${limpia.slice(3)}`;
  return limpia;
}
export const esPlacaValida = (p) => /^[A-Z]{3}-\d{3,4}$/.test(p) || /^[A-Z]{2}\d{3}[A-Z]$/.test(p);

/** Cédula ecuatoriana (módulo 10) — misma validación que el backend */
export function esCedulaValida(c) {
  if (!/^\d{10}$/.test(c)) return false;
  const prov = Number(c.slice(0, 2));
  if (!((prov >= 1 && prov <= 24) || prov === 30) || Number(c[2]) >= 6) return false;
  let suma = 0;
  for (let i = 0; i < 9; i += 1) {
    let p = Number(c[i]) * (i % 2 === 0 ? 2 : 1);
    if (p > 9) p -= 9;
    suma += p;
  }
  return (10 - (suma % 10)) % 10 === Number(c[9]);
}
