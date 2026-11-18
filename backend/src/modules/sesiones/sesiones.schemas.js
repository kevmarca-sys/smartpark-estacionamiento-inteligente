const { z } = require('zod');
const { placa, tipoVehiculo } = require('../vehiculos/vehiculos.schemas');

const entradaSchema = z.object({
  placa,
  tipo: tipoVehiculo.optional(),            // obligatorio solo si el vehículo es nuevo
  espacioCodigo: z.string().trim().toUpperCase().regex(/^[A-Z]\d{1,3}$/, 'Código de espacio no válido').optional(),
  metodoRegistro: z.enum(['LPR', 'MANUAL']).default('MANUAL'),
  confianza: z.coerce.number().min(0).max(100).optional(),
});

const salidaSchema = z.object({
  metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA'], { error: 'Seleccione el método de pago: EFECTIVO o TRANSFERENCIA' }),
  referencia: z.string().trim().max(60).optional(),
}).refine((d) => d.metodo !== 'TRANSFERENCIA' || (d.referencia && d.referencia.length >= 4), {
  message: 'Para transferencias ingrese el número de comprobante (mínimo 4 caracteres)',
  path: ['referencia'],
});

const anularSchema = z.object({
  motivo: z.string({ error: 'El motivo es obligatorio' }).trim().min(10, 'Explique el motivo de la anulación (mínimo 10 caracteres)').max(200),
});

module.exports = { entradaSchema, salidaSchema, anularSchema };
