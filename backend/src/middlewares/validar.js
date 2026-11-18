const AppError = require('../utils/AppError');

/**
 * Valida req.body / req.query / req.params con un esquema de Zod.
 * Si hay errores responde 400 con el detalle de cada campo.
 * Uso: validar(esquema)            -> valida body
 *      validar(esquema, 'query')   -> valida query
 */
function validar(esquema, origen = 'body') {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req[origen] ?? {});
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((i) => ({
        campo: i.path.join('.') || origen,
        mensaje: i.message,
      }));
      return next(AppError.badRequest('Los datos enviados no son válidos', detalles));
    }
    if (origen === 'body') req.body = resultado.data;
    else req.validado = { ...(req.validado || {}), [origen]: resultado.data };
    return next();
  };
}

module.exports = validar;
