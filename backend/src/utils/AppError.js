/**
 * Error controlado de la aplicación.
 * El manejador global lo convierte en una respuesta HTTP consistente:
 * { ok: false, error: { codigo, mensaje, detalles } }
 */
class AppError extends Error {
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  static badRequest(mensaje, detalles) { return new AppError(400, 'DATOS_INVALIDOS', mensaje, detalles); }
  static unauthorized(mensaje = 'Debe iniciar sesión') { return new AppError(401, 'NO_AUTENTICADO', mensaje); }
  static forbidden(mensaje = 'No tiene permisos para realizar esta acción') { return new AppError(403, 'ACCESO_DENEGADO', mensaje); }
  static notFound(mensaje = 'Recurso no encontrado') { return new AppError(404, 'NO_ENCONTRADO', mensaje); }
  static conflict(mensaje, codigo = 'CONFLICTO') { return new AppError(409, codigo, mensaje); }
  static businessRule(mensaje, codigo = 'REGLA_DE_NEGOCIO') { return new AppError(422, codigo, mensaje); }
  static unavailable(mensaje) { return new AppError(503, 'SERVICIO_NO_DISPONIBLE', mensaje); }
}

module.exports = AppError;
