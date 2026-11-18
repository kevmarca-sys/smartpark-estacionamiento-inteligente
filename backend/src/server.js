const http = require('node:http');
const env = require('./config/env');
const app = require('./app');
const { pool } = require('./config/db');
const { iniciarSocket } = require('./services/socket');
const { correoConfigurado } = require('./services/correo');

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
    console.log(`  Correo: ${correoConfigurado ? 'configurado' : 'NO configurado (opcional)'}`);
    console.log(`  Lectura de placas: ${env.plateRecognizer.token ? 'configurada' : 'NO configurada (ingreso manual)'}`);
  });
}

iniciar();
