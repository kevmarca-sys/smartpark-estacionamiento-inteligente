const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool:', err.message);
});

/** Consulta simple con el pool. */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Ejecuta varias operaciones dentro de una TRANSACCIÓN.
 * Si cualquier operación falla se hace ROLLBACK y no quedan datos a medias.
 * @param {(client: import('pg').PoolClient) => Promise<any>} trabajo
 */
async function withTransaction(trabajo) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await trabajo(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
