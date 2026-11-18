const { z } = require('zod');

const TIPOS = ['AUTO', 'MOTO', 'DISCAPACIDAD'];

const crearEspacioSchema = z.object({
  codigo: z.string().trim().toUpperCase().regex(/^[A-Z]\d{1,3}$/, 'El código debe tener una letra de zona y un número, por ejemplo A21'),
  tipo: z.enum(TIPOS, { error: 'Tipo de espacio no válido (AUTO, MOTO o DISCAPACIDAD)' }),
  ordenCercania: z.coerce.number().int().min(1).max(999).optional(),
});

const actualizarEspacioSchema = z.object({
  tipo: z.enum(TIPOS).optional(),
  ordenCercania: z.coerce.number().int().min(1).max(999).optional(),
});

const cambiarEstadoSchema = z.object({
  estado: z.enum(['LIBRE', 'INHABILITADO'], { error: 'Solo se puede habilitar (LIBRE) o inhabilitar (INHABILITADO)' }),
  motivo: z.string().trim().max(200).optional(),
}).refine((d) => d.estado !== 'INHABILITADO' || (d.motivo && d.motivo.length >= 5), {
  message: 'Indique el motivo de la inhabilitación (mínimo 5 caracteres)',
  path: ['motivo'],
});

module.exports = { crearEspacioSchema, actualizarEspacioSchema, cambiarEstadoSchema };
