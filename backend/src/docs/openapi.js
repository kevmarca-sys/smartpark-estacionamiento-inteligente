/**
 * Documentación OpenAPI 3 de la API de SmartPark.
 * Disponible en /api/docs (Swagger UI).
 */
const bearer = [{ bearerAuth: [] }];

const json = (schema) => ({ 'application/json': { schema } });
const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });
const respuestas = (ok = 'Operación exitosa', extra = {}) => ({
  200: { description: ok },
  400: { description: 'Datos inválidos', content: json(ref('Error')) },
  401: { description: 'No autenticado', content: json(ref('Error')) },
  403: { description: 'Acceso denegado (rol sin permiso)', content: json(ref('Error')) },
  ...extra,
});
const paginacion = [
  { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'limite', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
  { name: 'ordenarPor', in: 'query', schema: { type: 'string' } },
  { name: 'direccion', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
];
const q = (name, descripcion, schema = { type: 'string' }) => ({ name, in: 'query', description: descripcion, schema });
const p = (name) => ({ name, in: 'path', required: true, schema: { type: 'string' } });

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'SmartPark API',
    version: '1.0.0',
    description: 'API REST del sistema de estacionamiento inteligente SmartPark (Cuenca, Ecuador).\n\n'
      + 'Usuarios de prueba: **admin / Admin123*** (ADMIN) y **guardia / Guardia123*** (GUARDIA).\n\n'
      + '1. Ejecute POST /api/auth/login\n2. Copie el token\n3. Presione **Authorize** y péguelo.',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              codigo: { type: 'string', example: 'ESPACIO_OCUPADO' },
              mensaje: { type: 'string', example: 'No se puede asignar el espacio A3: está ocupado' },
              detalles: { type: 'array', items: { type: 'object', properties: { campo: { type: 'string' }, mensaje: { type: 'string' } } } },
            },
          },
        },
      },
      Login: { type: 'object', required: ['usuario', 'password'], properties: { usuario: { type: 'string', example: 'guardia' }, password: { type: 'string', example: 'Guardia123*' } } },
      Entrada: {
        type: 'object', required: ['placa'],
        properties: {
          placa: { type: 'string', example: 'ABC-5678' },
          tipo: { type: 'string', enum: ['AUTO', 'MOTO', 'DISCAPACIDAD'], description: 'Obligatorio si el vehículo es nuevo' },
          espacioCodigo: { type: 'string', example: 'A4', description: 'Opcional. Si no se envía, el sistema asigna automáticamente' },
          metodoRegistro: { type: 'string', enum: ['LPR', 'MANUAL'] },
          confianza: { type: 'number', example: 96.5 },
        },
      },
      Salida: {
        type: 'object', required: ['metodo'],
        properties: { metodo: { type: 'string', enum: ['EFECTIVO', 'TRANSFERENCIA'] }, referencia: { type: 'string', example: 'TRX-88213' } },
      },
      Cliente: {
        type: 'object', required: ['nombres'],
        properties: {
          nombres: { type: 'string', example: 'Andrea Vázquez' },
          cedula: { type: 'string', example: '0104567896' },
          correo: { type: 'string', example: 'andrea@correo.ec' },
          telefono: { type: 'string', example: '0987654321' },
          vehiculo: { type: 'object', properties: { placa: { type: 'string', example: 'AAZ-4455' }, tipo: { type: 'string', example: 'AUTO' } } },
        },
      },
      Espacio: { type: 'object', required: ['codigo', 'tipo'], properties: { codigo: { type: 'string', example: 'B21' }, tipo: { type: 'string', example: 'AUTO' }, ordenCercania: { type: 'integer', example: 41 } } },
      EstadoEspacio: { type: 'object', required: ['estado'], properties: { estado: { type: 'string', enum: ['LIBRE', 'INHABILITADO'] }, motivo: { type: 'string', example: 'Bache en la calzada' } } },
      Tarifa: { type: 'object', properties: { valorHora: { type: 'number', example: 0.5 }, fraccionMinutos: { type: 'integer', example: 15 }, minutosGracia: { type: 'integer', example: 10 }, topeDiario: { type: 'number', example: 6 } } },
      Regla: { type: 'object', properties: { activa: { type: 'boolean' }, porcentaje: { type: 'number', example: 50 }, umbral: { type: 'number', example: 80 }, horaInicio: { type: 'string', example: '17:00' }, horaFin: { type: 'string', example: '19:00' } } },
      Usuario: { type: 'object', properties: { nombre: { type: 'string' }, usuario: { type: 'string' }, correo: { type: 'string' }, password: { type: 'string' }, rol: { type: 'string', enum: ['ADMIN', 'GUARDIA'] } } },
    },
  },
  tags: [
    { name: 'Autenticación' }, { name: 'Sesiones (entrada/salida/cobro)' }, { name: 'Espacios' }, { name: 'Vehículos' },
    { name: 'Clientes' }, { name: 'Tarifas' }, { name: 'Reportes' }, { name: 'Auditoría' }, { name: 'Usuarios' },
    { name: 'Lectura de placas (LPR)' }, { name: 'Público (ticket del cliente)' },
  ],
  paths: {
    '/api/auth/login': { post: { tags: ['Autenticación'], summary: 'Iniciar sesión (devuelve JWT)', requestBody: { required: true, content: json(ref('Login')) }, responses: respuestas('Token JWT y datos del usuario') } },
    '/api/auth/perfil': { get: { tags: ['Autenticación'], summary: 'Datos del usuario autenticado', security: bearer, responses: respuestas() } },
    '/api/auth/logout': { post: { tags: ['Autenticación'], summary: 'Cerrar sesión (registra auditoría)', security: bearer, responses: respuestas() } },

    '/api/sesiones': { get: { tags: ['Sesiones (entrada/salida/cobro)'], summary: 'Historial con búsqueda, filtros combinados, orden y paginación', security: bearer, parameters: [...paginacion, q('q', 'Placa, ticket o cliente'), q('estado', 'ABIERTA, CERRADA, ANULADA'), q('desde', 'AAAA-MM-DD'), q('hasta', 'AAAA-MM-DD'), q('espacio', 'Código, ej. A3'), q('metodo', 'EFECTIVO o TRANSFERENCIA'), q('tipoVehiculo', 'AUTO, MOTO, DISCAPACIDAD')], responses: respuestas() } },
    '/api/sesiones/entrada': { post: { tags: ['Sesiones (entrada/salida/cobro)'], summary: 'Registrar entrada (asignación automática de espacio + ticket QR)', security: bearer, requestBody: { required: true, content: json(ref('Entrada')) }, responses: respuestas('Entrada registrada', { 201: { description: 'Entrada registrada' }, 409: { description: 'Vehículo con sesión abierta / sin espacios', content: json(ref('Error')) }, 422: { description: 'Espacio ocupado, inhabilitado o incompatible', content: json(ref('Error')) } }) } },
    '/api/sesiones/{codigo}': { get: { tags: ['Sesiones (entrada/salida/cobro)'], summary: 'Detalle de un ticket', security: bearer, parameters: [p('codigo')], responses: respuestas('Detalle', { 404: { description: 'No existe', content: json(ref('Error')) } }) } },
    '/api/sesiones/{codigo}/cobro': { get: { tags: ['Sesiones (entrada/salida/cobro)'], summary: 'Vista previa del cobro (al escanear el QR)', security: bearer, parameters: [p('codigo')], responses: respuestas('Cálculo de la tarifa', { 409: { description: 'Ticket ya cerrado', content: json(ref('Error')) } }) } },
    '/api/sesiones/{codigo}/salida': { post: { tags: ['Sesiones (entrada/salida/cobro)'], summary: 'Registrar pago y salida (transacción, libera el espacio)', security: bearer, parameters: [p('codigo')], requestBody: { required: true, content: json(ref('Salida')) }, responses: respuestas('Pago registrado', { 409: { description: 'Ticket ya cobrado', content: json(ref('Error')) } }) } },
    '/api/sesiones/{codigo}/anular': { post: { tags: ['Sesiones (entrada/salida/cobro)'], summary: 'Anular una sesión abierta (solo ADMIN)', security: bearer, parameters: [p('codigo')], requestBody: { content: json({ type: 'object', properties: { motivo: { type: 'string' } } }) }, responses: respuestas() } },
    '/api/sesiones/{codigo}/ticket': { get: { tags: ['Sesiones (entrada/salida/cobro)'], summary: 'Ticket con código QR (para volver a mostrarlo o imprimirlo)', security: bearer, parameters: [p('codigo')], responses: respuestas('Ticket', { 404: { description: 'No existe', content: json(ref('Error')) } }) } },
    '/api/sesiones/{codigo}/comprobante': { get: { tags: ['Sesiones (entrada/salida/cobro)'], summary: 'Comprobante de pago en PDF', security: bearer, parameters: [p('codigo')], responses: { 200: { description: 'PDF' } } } },

    '/api/espacios': {
      get: { tags: ['Espacios'], summary: 'Listar espacios con filtros y paginación', security: bearer, parameters: [...paginacion, q('q', 'Código o placa'), q('zona', 'A o B'), q('tipo', 'AUTO, MOTO, DISCAPACIDAD'), q('estado', 'LIBRE, OCUPADO, INHABILITADO')], responses: respuestas() },
      post: { tags: ['Espacios'], summary: 'Crear espacio (ADMIN)', security: bearer, requestBody: { content: json(ref('Espacio')) }, responses: respuestas('Creado', { 409: { description: 'Código duplicado' } }) },
    },
    '/api/espacios/mapa': { get: { tags: ['Espacios'], summary: 'Mapa completo con la placa de cada espacio ocupado', security: bearer, responses: respuestas() } },
    '/api/espacios/{id}': {
      put: { tags: ['Espacios'], summary: 'Actualizar espacio (ADMIN)', security: bearer, parameters: [p('id')], requestBody: { content: json(ref('Espacio')) }, responses: respuestas() },
      delete: { tags: ['Espacios'], summary: 'Eliminar espacio sin historial (ADMIN)', security: bearer, parameters: [p('id')], responses: respuestas() },
    },
    '/api/espacios/{id}/estado': { patch: { tags: ['Espacios'], summary: 'Habilitar / inhabilitar (ADMIN)', security: bearer, parameters: [p('id')], requestBody: { content: json(ref('EstadoEspacio')) }, responses: respuestas() } },

    '/api/vehiculos': {
      get: { tags: ['Vehículos'], summary: 'Listar vehículos con visitas y gasto', security: bearer, parameters: [...paginacion, q('q', 'Placa, cliente o cédula'), q('tipo', 'Tipo'), q('registrado', 'true/false'), q('frecuentes', 'true')], responses: respuestas() },
      post: { tags: ['Vehículos'], summary: 'Registrar vehículo', security: bearer, responses: respuestas() },
    },
    '/api/vehiculos/{placa}': { get: { tags: ['Vehículos'], summary: 'Detalle con historial y estadísticas', security: bearer, parameters: [p('placa')], responses: respuestas() } },
    '/api/vehiculos/{id}': { patch: { tags: ['Vehículos'], summary: 'Actualizar tipo o cliente (ADMIN)', security: bearer, parameters: [p('id')], responses: respuestas() } },

    '/api/clientes': {
      get: { tags: ['Clientes'], summary: 'Listar clientes', security: bearer, parameters: [...paginacion, q('q', 'Nombre, cédula, correo o placa')], responses: respuestas() },
      post: { tags: ['Clientes'], summary: 'Registrar cliente con su vehículo (transacción)', security: bearer, requestBody: { content: json(ref('Cliente')) }, responses: respuestas('Creado', { 409: { description: 'Placa o cédula duplicada' } }) },
    },
    '/api/clientes/{id}': {
      get: { tags: ['Clientes'], summary: 'Detalle', security: bearer, parameters: [p('id')], responses: respuestas() },
      patch: { tags: ['Clientes'], summary: 'Actualizar (ADMIN)', security: bearer, parameters: [p('id')], requestBody: { content: json(ref('Cliente')) }, responses: respuestas() },
      delete: { tags: ['Clientes'], summary: 'Eliminar (ADMIN)', security: bearer, parameters: [p('id')], responses: respuestas() },
    },

    '/api/tarifas': { get: { tags: ['Tarifas'], summary: 'Tarifas, reglas dinámicas y tarifa vigente', security: bearer, responses: respuestas() } },
    '/api/tarifas/{tipo}': { put: { tags: ['Tarifas'], summary: 'Actualizar tarifa base (ADMIN)', security: bearer, parameters: [p('tipo')], requestBody: { content: json(ref('Tarifa')) }, responses: respuestas() } },
    '/api/tarifas/reglas/{codigo}': { put: { tags: ['Tarifas'], summary: 'Actualizar regla dinámica (ADMIN)', security: bearer, parameters: [p('codigo')], requestBody: { content: json(ref('Regla')) }, responses: respuestas() } },
    '/api/tarifas/simular': { post: { tags: ['Tarifas'], summary: 'Simulador de cobro (ADMIN)', security: bearer, requestBody: { content: json({ type: 'object', properties: { tipoVehiculo: { type: 'string', example: 'AUTO' }, fechaEntrada: { type: 'string', example: '2026-11-20T17:30:00-05:00' }, fechaSalida: { type: 'string', example: '2026-11-20T19:45:00-05:00' }, ocupacion: { type: 'number', example: 85 }, visitasPrevias: { type: 'integer', example: 12 } } }) }, responses: respuestas() } },

    '/api/reportes/dashboard': { get: { tags: ['Reportes'], summary: 'Indicadores del panel en vivo (ADMIN)', security: bearer, responses: respuestas() } },
    '/api/reportes/resumen': { get: { tags: ['Reportes'], summary: 'Reporte con filtros (ADMIN)', security: bearer, parameters: [q('desde', 'AAAA-MM-DD'), q('hasta', 'AAAA-MM-DD'), q('tipoVehiculo', 'Tipo'), q('zona', 'A o B')], responses: respuestas() } },
    '/api/reportes/pdf': { get: { tags: ['Reportes'], summary: 'Reporte en PDF (ADMIN)', security: bearer, parameters: [q('desde', 'AAAA-MM-DD'), q('hasta', 'AAAA-MM-DD')], responses: { 200: { description: 'PDF' } } } },

    '/api/auditoria': { get: { tags: ['Auditoría'], summary: 'Registro de auditoría (ADMIN)', security: bearer, parameters: [...paginacion, q('accion', 'Acción'), q('usuarioId', 'Usuario'), q('desde', 'AAAA-MM-DD'), q('hasta', 'AAAA-MM-DD'), q('q', 'Texto')], responses: respuestas() } },

    '/api/usuarios': {
      get: { tags: ['Usuarios'], summary: 'Listar usuarios (ADMIN)', security: bearer, parameters: paginacion, responses: respuestas() },
      post: { tags: ['Usuarios'], summary: 'Crear usuario (ADMIN)', security: bearer, requestBody: { content: json(ref('Usuario')) }, responses: respuestas() },
    },
    '/api/usuarios/{id}': { patch: { tags: ['Usuarios'], summary: 'Actualizar / desactivar usuario (ADMIN)', security: bearer, parameters: [p('id')], requestBody: { content: json(ref('Usuario')) }, responses: respuestas() } },

    '/api/lpr/leer': { post: { tags: ['Lectura de placas (LPR)'], summary: 'Leer placa desde una foto (Plate Recognizer)', security: bearer, requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { imagen: { type: 'string', format: 'binary' } } } } } }, responses: respuestas('Placa leída', { 503: { description: 'Servicio no configurado: ingreso manual' } }) } },

    '/api/publico/tickets/{codigo}': { get: { tags: ['Público (ticket del cliente)'], summary: 'Ticket digital en vivo (sin login)', parameters: [p('codigo')], responses: { 200: { description: 'Datos del ticket' }, 404: { description: 'No existe' } } } },
    '/api/publico/tickets/{codigo}/comprobante': { get: { tags: ['Público (ticket del cliente)'], summary: 'Comprobante PDF del ticket pagado', parameters: [p('codigo')], responses: { 200: { description: 'PDF' } } } },
  },
};
