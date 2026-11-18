/**
 * Utilidades para paginación real desde el backend.
 */
function obtenerPaginacion(query) {
  const pagina = Math.max(1, Number.parseInt(query.pagina, 10) || 1);
  const limite = Math.min(100, Math.max(1, Number.parseInt(query.limite, 10) || 10));
  return { pagina, limite, offset: (pagina - 1) * limite };
}

function respuestaPaginada(filas, total, { pagina, limite }) {
  return {
    datos: filas,
    paginacion: {
      pagina,
      limite,
      total,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    },
  };
}

/**
 * Construye la cláusula ORDER BY de forma segura usando una lista blanca de columnas
 * (evita inyección SQL en el ordenamiento).
 */
function construirOrden(ordenarPor, direccion, columnasPermitidas, porDefecto) {
  const columna = columnasPermitidas[ordenarPor] || columnasPermitidas[porDefecto];
  const dir = String(direccion).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${columna} ${dir}`;
}

module.exports = { obtenerPaginacion, respuestaPaginada, construirOrden };
