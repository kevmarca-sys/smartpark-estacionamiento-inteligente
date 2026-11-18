const { query } = require('../../config/db');
const { crearFiltros } = require('../../utils/filtros');

const TZ = "'America/Guayaquil'";

async function ingresosDelDia(diasAtras = 0) {
  const r = await query(
    `SELECT COALESCE(SUM(monto), 0)::numeric(10,2) AS ingresos, COUNT(*)::int AS transacciones
       FROM pagos
      WHERE (fecha AT TIME ZONE ${TZ})::date = (NOW() AT TIME ZONE ${TZ})::date - $1::int`,
    [diasAtras],
  );
  return r.rows[0];
}

async function estadiaPromedioHoy() {
  const r = await query(
    `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (fecha_salida - fecha_entrada)) / 60)), 0)::int AS minutos
       FROM sesiones WHERE estado = 'CERRADA' AND fecha_salida >= NOW() - INTERVAL '7 days'`,
  );
  return r.rows[0].minutos;
}

/** % de ocupación por hora del día de hoy (06:00 a 22:00). */
async function ocupacionPorHoraHoy(espaciosOperativos) {
  const r = await query(
    `WITH horas AS (
       SELECT generate_series(6, 22) AS hora
     ), limites AS (
       SELECT hora, ((NOW() AT TIME ZONE ${TZ})::date + make_interval(hours => hora)) AT TIME ZONE ${TZ} AS instante FROM horas
     )
     SELECT l.hora,
            CASE WHEN l.instante > NOW() THEN NULL ELSE
              (SELECT COUNT(*) FROM sesiones s
                WHERE s.estado <> 'ANULADA' AND s.fecha_entrada <= l.instante
                  AND (s.fecha_salida IS NULL OR s.fecha_salida > l.instante))::int END AS ocupados
       FROM limites l ORDER BY l.hora`,
  );
  return r.rows.map((f) => ({
    hora: `${String(f.hora).padStart(2, '0')}:00`,
    ocupados: f.ocupados,
    ocupacion: f.ocupados === null ? null : Math.round((f.ocupados / Math.max(1, espaciosOperativos)) * 100),
  }));
}

function filtrosRango({ desde, hasta, tipoVehiculo, zona }) {
  const f = crearFiltros();
  f.agregarSinValor("s.estado = 'CERRADA'");
  f.agregar(`s.fecha_salida >= (?::date)::timestamp AT TIME ZONE ${TZ}`, desde);
  f.agregar(`s.fecha_salida < ((?::date + 1)::timestamp AT TIME ZONE ${TZ})`, hasta);
  if (tipoVehiculo) f.agregar('v.tipo = ?', tipoVehiculo);
  if (zona) f.agregar('e.zona = ?', zona);
  return f;
}

const FROM = 'FROM sesiones s JOIN vehiculos v ON v.id = s.vehiculo_id JOIN espacios e ON e.id = s.espacio_id LEFT JOIN clientes c ON c.id = v.cliente_id LEFT JOIN pagos p ON p.sesion_id = s.id';

async function resumen(filtros) {
  const f = filtrosRango(filtros);
  const [totales, porDia, porTipo, porMetodo, porHora, calor, top] = await Promise.all([
    query(`SELECT COALESCE(SUM(s.total), 0)::numeric(12,2) AS ingresos, COUNT(*)::int AS sesiones,
                  COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (s.fecha_salida - s.fecha_entrada)) / 60)), 0)::int AS "minutosPromedio",
                  COALESCE(ROUND(AVG(s.total), 2), 0)::numeric(10,2) AS "ticketPromedio",
                  COALESCE(ROUND(AVG(s.ocupacion_entrada), 1), 0)::numeric(5,1) AS "ocupacionPromedio"
             ${FROM} ${f.where}`, f.valores),
    query(`SELECT to_char((s.fecha_salida AT TIME ZONE ${TZ})::date, 'YYYY-MM-DD') AS dia, COUNT(*)::int AS sesiones,
                  SUM(s.total)::numeric(12,2) AS ingresos
             ${FROM} ${f.where} GROUP BY 1 ORDER BY 1`, f.valores),
    query(`SELECT v.tipo, COUNT(*)::int AS sesiones, SUM(s.total)::numeric(12,2) AS ingresos
             ${FROM} ${f.where} GROUP BY 1 ORDER BY 2 DESC`, f.valores),
    query(`SELECT COALESCE(p.metodo, 'SIN PAGO') AS metodo, COUNT(*)::int AS sesiones, SUM(s.total)::numeric(12,2) AS ingresos
             ${FROM} ${f.where} GROUP BY 1 ORDER BY 2 DESC`, f.valores),
    query(`SELECT EXTRACT(HOUR FROM s.fecha_entrada AT TIME ZONE ${TZ})::int AS hora, COUNT(*)::int AS entradas
             ${FROM} ${f.where} GROUP BY 1 ORDER BY 1`, f.valores),
    query(`SELECT EXTRACT(ISODOW FROM s.fecha_entrada AT TIME ZONE ${TZ})::int AS dia,
                  EXTRACT(HOUR FROM s.fecha_entrada AT TIME ZONE ${TZ})::int AS hora, COUNT(*)::int AS entradas
             ${FROM} ${f.where} GROUP BY 1, 2`, f.valores),
    query(`SELECT v.placa, c.nombres AS cliente, COUNT(*)::int AS visitas, SUM(s.total)::numeric(12,2) AS gastado
             ${FROM} ${f.where} GROUP BY v.placa, c.nombres ORDER BY visitas DESC, gastado DESC LIMIT 5`, f.valores),
  ]);
  return {
    resumen: totales.rows[0],
    porDia: porDia.rows,
    porTipo: porTipo.rows,
    porMetodo: porMetodo.rows,
    porHora: porHora.rows,
    mapaCalor: calor.rows,
    topClientes: top.rows,
  };
}

module.exports = { ingresosDelDia, estadiaPromedioHoy, ocupacionPorHoraHoy, resumen };
