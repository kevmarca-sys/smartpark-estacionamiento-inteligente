/**
 * Constructor de filtros SQL parametrizados (evita inyección SQL).
 * Cada "?" del fragmento se reemplaza por el mismo parámetro $n.
 *   const f = crearFiltros();
 *   f.agregar('placa ILIKE ?', '%ABC%');
 *   f.where -> 'WHERE placa ILIKE $1'   f.valores -> ['%ABC%']
 */
function crearFiltros() {
  const condiciones = [];
  const valores = [];
  return {
    agregar(sql, valor) {
      valores.push(valor);
      condiciones.push(sql.replaceAll('?', `$${valores.length}`));
    },
    agregarSinValor(sql) { condiciones.push(sql); },
    get where() { return condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : ''; },
    get valores() { return valores; },
    siguiente(n = 1) { return `$${valores.length + n}`; },
  };
}
module.exports = { crearFiltros };
