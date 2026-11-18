const { z } = require('zod');
const { normalizarPlaca, esPlacaValida } = require('../../utils/validadores');

/** Placa ecuatoriana: se normaliza (abc1234 -> ABC-1234) y se valida el formato. */
const placa = z.string({ error: 'La placa es obligatoria' })
  .transform(normalizarPlaca)
  .refine(esPlacaValida, 'Placa no válida. Formato auto: ABC-1234 · moto: AB123C');

const tipoVehiculo = z.enum(['AUTO', 'MOTO', 'DISCAPACIDAD'], { error: 'Tipo de vehículo no válido (AUTO, MOTO o DISCAPACIDAD)' });

const crearVehiculoSchema = z.object({
  placa,
  tipo: tipoVehiculo,
  clienteId: z.coerce.number().int().positive().nullable().optional(),
});

const actualizarVehiculoSchema = z.object({
  tipo: tipoVehiculo.optional(),
  clienteId: z.coerce.number().int().positive().nullable().optional(),
});

module.exports = { placa, tipoVehiculo, crearVehiculoSchema, actualizarVehiculoSchema };
