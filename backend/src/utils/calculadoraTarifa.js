/**
 * Calculadora de tarifa dinámica.
 * Función pura (sin base de datos) para poder probarla y explicarla fácilmente.
 *
 * Regla de negocio: el cálculo de la tarifa se realiza SIEMPRE en el backend
 * con reglas configurables (tablas `tarifas` y `reglas_tarifa`).
 */

const redondear = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Devuelve los minutos del día (0-1439) de una fecha en la zona horaria del negocio. */
function minutosDelDia(fecha, zonaHoraria) {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: zonaHoraria, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(fecha);
  const h = Number(partes.find((p) => p.type === 'hour').value);
  const m = Number(partes.find((p) => p.type === 'minute').value);
  return h * 60 + m;
}

function horaAMinutos(hora) {
  if (!hora) return null;
  const [h, m] = String(hora).split(':').map(Number);
  return h * 60 + (m || 0);
}

/** ¿El minuto del día está dentro del rango? Soporta rangos que cruzan medianoche (22:00-06:00). */
function enRango(minuto, inicio, fin) {
  if (inicio === null || fin === null) return false;
  if (inicio <= fin) return minuto >= inicio && minuto < fin;
  return minuto >= inicio || minuto < fin;
}

/**
 * Determina qué reglas dinámicas aplican a una sesión.
 * @returns {Array<{codigo, nombre, porcentaje, motivo}>}
 */
function reglasAplicables({ reglas, fechaReferencia, ocupacion, visitasPrevias, zonaHoraria }) {
  const minuto = minutosDelDia(fechaReferencia, zonaHoraria);
  const aplicadas = [];

  for (const regla of reglas) {
    if (!regla.activa) continue;
    const porcentaje = Number(regla.porcentaje);
    const umbral = regla.umbral === null ? null : Number(regla.umbral);

    switch (regla.codigo) {
      case 'ALTA_DEMANDA':
        if (ocupacion >= umbral) {
          aplicadas.push({ codigo: regla.codigo, nombre: regla.nombre, porcentaje, motivo: `Ocupación ${ocupacion}% ≥ ${umbral}%` });
        }
        break;
      case 'HORA_PICO':
      case 'NOCTURNA':
        if (enRango(minuto, horaAMinutos(regla.hora_inicio), horaAMinutos(regla.hora_fin))) {
          aplicadas.push({
            codigo: regla.codigo,
            nombre: regla.nombre,
            porcentaje,
            motivo: `Ingreso entre ${String(regla.hora_inicio).slice(0, 5)} y ${String(regla.hora_fin).slice(0, 5)}`,
          });
        }
        break;
      case 'CLIENTE_FRECUENTE':
        if (visitasPrevias >= umbral) {
          aplicadas.push({ codigo: regla.codigo, nombre: regla.nombre, porcentaje, motivo: `${visitasPrevias} visitas previas` });
        }
        break;
      default:
        break;
    }
  }
  return aplicadas;
}

/**
 * Calcula el valor a pagar de una sesión.
 * @param {object} p
 * @param {Date} p.fechaEntrada
 * @param {Date} p.fechaSalida
 * @param {object} p.tarifa  fila de la tabla tarifas
 * @param {Array}  p.reglas  filas de la tabla reglas_tarifa
 * @param {number} p.ocupacionEntrada  % de ocupación cuando ingresó
 * @param {number} p.visitasPrevias    sesiones cerradas anteriores del vehículo
 * @param {string} p.zonaHoraria
 */
function calcularTarifa({ fechaEntrada, fechaSalida, tarifa, reglas, ocupacionEntrada, visitasPrevias, zonaHoraria }) {
  const valorHora = Number(tarifa.valor_hora);
  const fraccion = Number(tarifa.fraccion_minutos);
  const gracia = Number(tarifa.minutos_gracia);
  const tope = Number(tarifa.tope_diario);

  const minutos = Math.max(1, Math.ceil((fechaSalida.getTime() - fechaEntrada.getTime()) / 60000));

  if (minutos <= gracia) {
    return {
      minutos, fracciones: 0, valorFraccion: 0, subtotal: 0, topeAplicado: false,
      ajustes: [], total: 0, enGracia: true,
      mensaje: `Salida dentro de los ${gracia} minutos de gracia`,
    };
  }

  const fracciones = Math.ceil(minutos / fraccion);
  const valorFraccion = (valorHora * fraccion) / 60;
  let subtotal = fracciones * valorFraccion;

  const dias = Math.ceil(minutos / 1440);
  const topeTotal = tope * dias;
  const topeAplicado = subtotal > topeTotal;
  if (topeAplicado) subtotal = topeTotal;
  subtotal = redondear(subtotal);

  const ajustes = reglasAplicables({
    reglas, fechaReferencia: fechaEntrada, ocupacion: Number(ocupacionEntrada), visitasPrevias, zonaHoraria,
  }).map((r) => ({ ...r, monto: redondear((subtotal * r.porcentaje) / 100) }));

  const total = Math.max(0, redondear(subtotal + ajustes.reduce((s, a) => s + a.monto, 0)));

  return {
    minutos, fracciones, valorFraccion: redondear(valorFraccion), subtotal, topeAplicado,
    ajustes, total, enGracia: false,
  };
}

/** Tarifa por hora vigente en este momento (para mostrar en el panel y en la entrada). */
function tarifaVigente({ tarifa, reglas, ocupacion, ahora, zonaHoraria }) {
  const base = Number(tarifa.valor_hora);
  const ajustes = reglasAplicables({ reglas, fechaReferencia: ahora, ocupacion, visitasPrevias: 0, zonaHoraria })
    .filter((r) => r.codigo !== 'CLIENTE_FRECUENTE');
  const porcentaje = ajustes.reduce((s, a) => s + a.porcentaje, 0);
  return {
    tipoVehiculo: tarifa.tipo_vehiculo,
    base,
    porcentaje,
    valorHora: Math.max(0, redondear(base * (1 + porcentaje / 100))),
    ajustes,
  };
}

module.exports = { calcularTarifa, tarifaVigente, reglasAplicables, enRango, minutosDelDia, redondear };
