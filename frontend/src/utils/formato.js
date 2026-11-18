/**
 * Utilidades de formato
 *
 * Formato de dinero, fechas, horas y duraciones en la zona horaria de Ecuador.
 */

const TZ = 'America/Guayaquil';

export const dinero = (n) => `$${Number(n || 0).toFixed(2)}`;

export const fechaHora = (f) => (f ? new Date(f).toLocaleString('es-EC', {
  timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
}) : '—');

export const hora = (f) => (f ? new Date(f).toLocaleTimeString('es-EC', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }) : '—');

export const fechaCorta = (f) => (f ? new Date(`${f}T12:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) : '');

/** Convierte minutos en un texto legible, por ejemplo "1 h 25 min". */
export function duracion(minutos) {
  const m = Math.max(0, Math.round(Number(minutos) || 0));
  const h = Math.floor(m / 60);
  return h ? `${h} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`;
}

/** Fecha de hoy (o de hace n días) en formato AAAA-MM-DD. */
export function hoyISO(diasAtras = 0) {
  return new Date(Date.now() - diasAtras * 86400000).toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Tiempo transcurrido desde una fecha, por ejemplo "hace 5 min". */
export function haceCuanto(f) {
  const min = Math.round((Date.now() - new Date(f).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `hace ${h} h` : fechaHora(f);
}
