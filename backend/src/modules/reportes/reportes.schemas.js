/**
 * Módulo Reportes · Esquemas de validación (DTO)
 *
 * Esquemas Zod que validan y normalizan los datos de entrada antes del controlador.
 */

const { z } = require('zod');

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida (AAAA-MM-DD)');

const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
const haceDias = (n) => {
  const d = new Date(Date.now() - n * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Guayaquil' });
};

const rangoSchema = z.object({
  desde: fecha.default(() => haceDias(13)),
  hasta: fecha.default(hoy),
  tipoVehiculo: z.enum(['AUTO', 'MOTO', 'DISCAPACIDAD']).optional(),
  zona: z.string().trim().toUpperCase().max(5).optional(),
}).refine((d) => d.desde <= d.hasta, { message: 'La fecha "desde" no puede ser mayor que "hasta"', path: ['desde'] })
  .refine((d) => (new Date(d.hasta) - new Date(d.desde)) / 86400000 <= 366, { message: 'El rango máximo es de un año', path: ['hasta'] });

module.exports = { rangoSchema };
