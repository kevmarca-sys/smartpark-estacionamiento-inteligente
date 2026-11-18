/**
 * Punto de entrada del backend
 *
 * Verifica la conexión con PostgreSQL, inicia Socket.io sobre el mismo servidor
 * HTTP y pone la API a escuchar en el puerto configurado.
 */

const http = require('node:http');
const env = require('./config/env');
const app = require('./app');
const { pool } = require('./config/db');
const { iniciarSocket } = require('./services/socket');

const servidor = http.createServer(app);
iniciarSocket(servidor);

async function iniciar() {
  try {
    await pool.query('SELECT 1');
    console.log('✔ Conectado a PostgreSQL');
  } catch (error) {
    console.error('✖ No se pudo conectar a PostgreSQL:', error.message);
    process.exit(1);
  }
  servidor.listen(env.port, () => {
    console.log(`✔ SmartPark API escuchando en http://localhost:${env.port}`);
    console.log(`  Documentación Swagger: http://localhost:${env.port}/api/docs`);
    console.log(`  Lectura de placas: ${env.plateRecognizer.token ? 'configurada' : 'NO configurada (ingreso manual)'}`);
  });
}

iniciar();
