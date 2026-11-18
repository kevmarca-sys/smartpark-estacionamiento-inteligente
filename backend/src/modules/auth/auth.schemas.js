const { z } = require('zod');

const loginSchema = z.object({
  usuario: z.string({ error: 'El usuario es obligatorio' }).trim().min(3, 'El usuario debe tener al menos 3 caracteres').max(120),
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria').max(100),
});

module.exports = { loginSchema };
