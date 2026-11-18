const { z } = require('zod');

const password = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72)
  .regex(/[A-Z]/, 'La contraseña debe tener al menos una mayúscula')
  .regex(/[0-9]/, 'La contraseña debe tener al menos un número');

const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  usuario: z.string().trim().toLowerCase().regex(/^[a-z0-9._]{3,50}$/, 'El usuario solo puede tener letras, números, punto y guion bajo (3 a 50)'),
  correo: z.string().trim().toLowerCase().email('Correo no válido').max(120),
  password,
  rol: z.enum(['ADMIN', 'GUARDIA'], { error: 'El rol debe ser ADMIN o GUARDIA' }),
});

const actualizarUsuarioSchema = z.object({
  nombre: z.string().trim().min(3).max(100).optional(),
  correo: z.string().trim().toLowerCase().email('Correo no válido').optional(),
  rol: z.enum(['ADMIN', 'GUARDIA']).optional(),
  activo: z.boolean().optional(),
  password: password.optional(),
});

module.exports = { crearUsuarioSchema, actualizarUsuarioSchema };
