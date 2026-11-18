const { z } = require('zod');
const { esCedulaValida } = require('../../utils/validadores');
const { placa, tipoVehiculo } = require('../vehiculos/vehiculos.schemas');

const vacioANull = (v) => (v === '' ? null : v);

const cedula = z.preprocess(vacioANull, z.string().trim()
  .regex(/^\d{10}$/, 'La cédula debe tener exactamente 10 dígitos numéricos')
  .refine(esCedulaValida, 'La cédula no es válida (dígito verificador incorrecto)')
  .nullable().optional());

const correo = z.preprocess(vacioANull, z.string().trim().toLowerCase().email('Correo electrónico no válido').max(120).nullable().optional());
const telefono = z.preprocess(vacioANull, z.string().trim()
  .regex(/^(09\d{8}|\+5939\d{8})$/, 'Teléfono no válido. Formato: 09XXXXXXXX o +5939XXXXXXXX').nullable().optional());

const clienteBase = {
  nombres: z.string({ error: 'El nombre es obligatorio' }).trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres').max(120)
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/, 'El nombre solo puede contener letras y espacios'),
  cedula,
  correo,
  telefono,
};

const crearClienteSchema = z.object({
  ...clienteBase,
  vehiculo: z.object({ placa, tipo: tipoVehiculo }).optional(),
});

const actualizarClienteSchema = z.object({
  nombres: clienteBase.nombres.optional(),
  cedula,
  correo,
  telefono,
});

module.exports = { crearClienteSchema, actualizarClienteSchema };
