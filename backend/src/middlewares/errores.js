const AppError = require('../utils/AppError');
const env = require('../config/env');

function noEncontrado(req, _res, next) {
  next(AppError.notFound(`La ruta ${req.method} ${req.originalUrl} no existe`));
}

/**
 * Manejador global de errores.
 * - Errores controlados (AppError) -> se responden tal cual.
 * - Errores de PostgreSQL conocidos -> se traducen a mensajes claros.
 * - Cualquier otro error -> 500 genérico SIN exponer detalles internos.
 */
// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, _next) {
  let error = err;

  if (!(error instanceof AppError)) {
    if (error.code === '23505') {
      // violación de restricción UNIQUE
      const mensajes = {
        vehiculos_placa_key: 'Esta placa ya está registrada',
        clientes_cedula_key: 'Ya existe un cliente con esta cédula',
        espacios_codigo_key: 'Ya existe un espacio con este código',
        usuarios_usuario_key: 'El nombre de usuario ya está en uso',
        usuarios_correo_key: 'El correo ya está en uso',
        uq_sesion_abierta_vehiculo: 'Este vehículo ya tiene una sesión de estacionamiento abierta',
        uq_sesion_abierta_espacio: 'El espacio ya está ocupado por otra sesión',
        pagos_sesion_id_key: 'Este ticket ya fue pagado',
      };
      error = AppError.conflict(mensajes[error.constraint] || 'El registro ya existe (dato duplicado)', 'DUPLICADO');
    } else if (error.code === '23503') {
      error = AppError.conflict('No se puede completar la operación porque el registro está relacionado con otros datos', 'RELACION_EXISTENTE');
    } else if (error.code === '23514' || error.code === '22P02') {
      error = AppError.badRequest('Algún dato enviado tiene un formato o valor no permitido');
    } else if (error.type === 'entity.parse.failed') {
      error = AppError.badRequest('El cuerpo de la petición no es un JSON válido');
    } else if (error.code === 'ECONNREFUSED') {
      error = AppError.unavailable('No hay conexión con la base de datos');
    } else {
      console.error('[ERROR NO CONTROLADO]', req.method, req.originalUrl, error);
      error = new AppError(500, 'ERROR_INTERNO', 'Ocurrió un error inesperado en el servidor');
    }
  }

  const cuerpo = { ok: false, error: { codigo: error.codigo, mensaje: error.message } };
  if (error.detalles) cuerpo.error.detalles = error.detalles;
  if (env.nodeEnv === 'development' && !(err instanceof AppError) && error.status === 500) {
    cuerpo.error.depuracion = 'Revise la consola del servidor';
  }
  res.status(error.status).json(cuerpo);
}

module.exports = { noEncontrado, manejadorErrores };
