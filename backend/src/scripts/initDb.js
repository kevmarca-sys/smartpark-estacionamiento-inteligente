/**
 * Crea las tablas y carga los datos de prueba.
 * Uso: npm run db:init   (usa DATABASE_URL del archivo .env)
 * ¡ATENCIÓN! Borra y vuelve a crear todas las tablas.
 */
const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../config/db');

async function main() {
  const opciones = [path.join(__dirname, '..', '..', 'database'), path.join(__dirname, '..', '..', '..', 'database')];
  const carpeta = opciones.find((c) => fs.existsSync(path.join(c, 'schema.sql')));
  if (!carpeta) throw new Error('No se encontró la carpeta database con schema.sql');
  for (const archivo of ['schema.sql', 'seed.sql']) {
    const sql = fs.readFileSync(path.join(carpeta, archivo), 'utf8');
    process.stdout.write(`Ejecutando ${archivo}... `);
    await pool.query(sql);
    console.log('OK');
  }
  await pool.end();
  console.log('Base de datos lista. Usuarios: admin / Admin123*  ·  guardia / Guardia123*');
}

main().catch((e) => { console.error('\nError:', e.message); process.exit(1); });
