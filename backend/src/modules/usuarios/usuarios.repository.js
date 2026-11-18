/**
 * Módulo Usuarios · Repositorio
 *
 * Acceso a datos con consultas SQL parametrizadas sobre PostgreSQL.
 */

const { query } = require('../../config/db');
const { crearFiltros } = require('../../utils/filtros');
const { construirOrden } = require('../../utils/paginacion');

const CAMPOS = 'id, nombre, usuario, correo, rol, activo, ultimo_acceso, creado_en';

/** Usuario por nombre de usuario o correo (inicio de sesión). */
async function buscarPorUsuarioOCorreo(valor) {
  const r = await query('SELECT * FROM usuarios WHERE LOWER(usuario) = LOWER($1) OR LOWER(correo) = LOWER($1)', [valor]);
  return r.rows[0];
}

/** Usuario por id, sin el hash de la contraseña. */
async function buscarPorId(id) {
  const r = await query(`SELECT ${CAMPOS} FROM usuarios WHERE id = $1`, [id]);
  return r.rows[0];
}

/** Guarda la fecha del último inicio de sesión. */
async function actualizarUltimoAcceso(id) {
  await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [id]);
}

/** Usuarios con filtros por rol y estado, búsqueda y paginación. */
async function listar({ q, rol, activo, ordenarPor, direccion }, { limite, offset }) {
  const f = crearFiltros();
  if (q) f.agregar('(nombre ILIKE ? OR usuario ILIKE ? OR correo ILIKE ?)', `%${q}%`);
  if (rol) f.agregar('rol = ?', rol);
  if (activo === 'true' || activo === 'false') f.agregar('activo = ?', activo === 'true');
  const orden = construirOrden(ordenarPor, direccion, { nombre: 'nombre', rol: 'rol', ultimo_acceso: 'ultimo_acceso', creado_en: 'creado_en' }, 'nombre');

  const total = await query(`SELECT COUNT(*)::int AS total FROM usuarios ${f.where}`, f.valores);
  const filas = await query(
    `SELECT ${CAMPOS} FROM usuarios ${f.where} ${orden} LIMIT ${f.siguiente(1)} OFFSET ${f.siguiente(2)}`,
    [...f.valores, limite, offset],
  );
  return { filas: filas.rows, total: total.rows[0].total };
}

/** Inserta un usuario. */
async function crear({ nombre, usuario, correo, passwordHash, rol }) {
  const r = await query(
    `INSERT INTO usuarios (nombre, usuario, correo, password_hash, rol) VALUES ($1, $2, $3, $4, $5) RETURNING ${CAMPOS}`,
    [nombre, usuario, correo, passwordHash, rol],
  );
  return r.rows[0];
}

/** Actualiza solo los campos enviados. */
async function actualizar(id, campos) {
  const permitidos = { nombre: 'nombre', correo: 'correo', rol: 'rol', activo: 'activo', passwordHash: 'password_hash' };
  const sets = [];
  const valores = [];
  Object.entries(campos).forEach(([k, v]) => {
    if (permitidos[k] && v !== undefined) { valores.push(v); sets.push(`${permitidos[k]} = $${valores.length}`); }
  });
  if (!sets.length) return buscarPorId(id);
  valores.push(id);
  const r = await query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = $${valores.length} RETURNING ${CAMPOS}`, valores);
  return r.rows[0];
}

/** Administradores activos, excluyendo opcionalmente a un usuario. */
async function contarAdminsActivos(excluirId) {
  const r = await query("SELECT COUNT(*)::int AS n FROM usuarios WHERE rol = 'ADMIN' AND activo AND id <> $1", [excluirId]);
  return r.rows[0].n;
}

module.exports = { buscarPorUsuarioOCorreo, buscarPorId, actualizarUltimoAcceso, listar, crear, actualizar, contarAdminsActivos };
