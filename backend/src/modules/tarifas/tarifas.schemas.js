const { z } = require('zod');

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:00)?$/, 'Hora no válida (formato HH:MM)');

const tarifaSchema = z.object({
  valorHora: z.coerce.number().positive('El valor por hora debe ser mayor a 0').max(50),
  fraccionMinutos: z.coerce.number().int().min(5, 'La fracción mínima es de 5 minutos').max(60),
  minutosGracia: z.coerce.number().int().min(0).max(60),
  topeDiario: z.coerce.number().positive('El tope diario debe ser mayor a 0').max(500),
}).refine((d) => d.topeDiario >= d.valorHora, { message: 'El tope diario no puede ser menor que el valor de una hora', path: ['topeDiario'] });

const reglaSchema = z.object({
  activa: z.boolean(),
  porcentaje: z.coerce.number().min(-90, 'El descuento máximo es -90%').max(200, 'El recargo máximo es 200%'),
  umbral: z.coerce.number().min(0).max(1000).nullable().optional(),
  horaInicio: hora.nullable().optional(),
  horaFin: hora.nullable().optional(),
});

const simularSchema = z.object({
  tipoVehiculo: z.enum(['AUTO', 'MOTO', 'DISCAPACIDAD']),
  fechaEntrada: z.coerce.date({ error: 'Fecha de entrada no válida' }),
  fechaSalida: z.coerce.date({ error: 'Fecha de salida no válida' }),
  ocupacion: z.coerce.number().min(0).max(100).default(50),
  visitasPrevias: z.coerce.number().int().min(0).default(0),
}).refine((d) => d.fechaSalida > d.fechaEntrada, { message: 'La salida debe ser posterior a la entrada', path: ['fechaSalida'] });

module.exports = { tarifaSchema, reglaSchema, simularSchema };
