const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const openapi = require('./docs/openapi');
const { noEncontrado, manejadorErrores } = require('./middlewares/errores');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.frontendUrl.split(',').map((u) => u.trim()) }));
app.use(express.json({ limit: '100kb' }));
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.get('/api/salud', (_req, res) => res.json({ ok: true, servicio: 'SmartPark API', fecha: new Date().toISOString() }));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'SmartPark API' }));
app.get('/api/openapi.json', (_req, res) => res.json(openapi));

app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/usuarios', require('./modules/usuarios/usuarios.routes'));
app.use('/api/clientes', require('./modules/clientes/clientes.routes'));
app.use('/api/vehiculos', require('./modules/vehiculos/vehiculos.routes'));
app.use('/api/espacios', require('./modules/espacios/espacios.routes'));
app.use('/api/tarifas', require('./modules/tarifas/tarifas.routes'));
app.use('/api/sesiones', require('./modules/sesiones/sesiones.routes'));
app.use('/api/reportes', require('./modules/reportes/reportes.routes'));
app.use('/api/auditoria', require('./modules/auditoria/auditoria.routes'));
app.use('/api/lpr', require('./modules/lpr/lpr.routes'));
app.use('/api/publico', require('./modules/publico/publico.routes'));

app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
