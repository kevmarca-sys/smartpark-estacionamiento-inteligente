/**
 * Módulo Sesiones · Servicio
 *
 * Ciclo completo de parqueo: entrada, cobro, salida y anulación. Las operaciones que
 * modifican datos se ejecutan en transacciones con bloqueo de filas.
 */

const crypto = require('node:crypto');
const repo = require('./sesiones.repository');
const vehiculosRepo = require('../vehiculos/vehiculos.repository');
const espaciosRepo = require('../espacios/espacios.repository');
const tarifasRepo = require('../tarifas/tarifas.repository');
const auditoria = require('../auditoria/auditoria.service');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');
const { withTransaction, query } = require('../../config/db');

const db0 = { query };
const { calcularTarifa, tarifaVigente } = require('../../utils/calculadoraTarifa');
const { tiposEspacioPermitidos, esCompatible } = require('../../utils/compatibilidad');
const { obtenerPaginacion, respuestaPaginada } = require('../../utils/paginacion');
const { generarQrDataUrl, urlTicket } = require('../../services/qr');
const { normalizarPlaca, esPlacaValida } = require('../../utils/validadores');
const { emitirCambio, emitirTicket } = require('../../services/socket');

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin 0/O ni 1/I para evitar confusiones al leerlo

/** Código de ticket aleatorio e impredecible (no se puede adivinar el ticket de otra persona). */
function generarCodigoTicket() {
  const bytes = crypto.randomBytes(8);
  let codigo = 'TK-';
  for (const b of bytes) codigo += ALFABETO[b % ALFABETO.length];
  return codigo;
}

/** Extrae el código de ticket de lo que lea el escáner (puede ser la URL completa del QR). */
function extraerCodigo(texto) {
  const valor = String(texto || '').trim();
  const coincidencia = valor.match(/TK-[A-Z0-9]{3,12}/i);
  return coincidencia ? coincidencia[0].toUpperCase() : valor.toUpperCase();
}

/**
 * Salida por placa: si lo leído es una placa (cámara LPR en la salida),
 * se busca la sesión ABIERTA de ese vehículo. Así el cliente no necesita el ticket.
 */
async function resolverCodigo(texto) {
  const valor = String(texto || '').trim();
  if (/TK-[A-Z0-9]{3,12}/i.test(valor)) return extraerCodigo(valor);
  const placa = normalizarPlaca(valor);
  if (esPlacaValida(placa)) {
    const r = await query(
      `SELECT s.codigo_ticket FROM sesiones s JOIN vehiculos v ON v.id = s.vehiculo_id
        WHERE v.placa = $1 AND s.estado = 'ABIERTA'`,
      [placa],
    );
    if (!r.rows[0]) throw AppError.notFound(`El vehículo ${placa} no tiene una sesión abierta`);
    return r.rows[0].codigo_ticket;
  }
  return extraerCodigo(valor);
}

/** Lista las sesiones con filtros, orden y paginación. */
async function listar(q) {
  const pag = obtenerPaginacion(q);
  const { filas, total, suma } = await repo.listar(q, pag);
  return { ...respuestaPaginada(filas, total, pag), totalRecaudado: suma };
}

/* -------------------------------------------------------------------
 * REGISTRAR ENTRADA (transacción)
 * Reglas de negocio aplicadas:
 *  1. Un vehículo no puede tener dos sesiones abiertas.
 *  2. No se asigna un espacio ocupado o inhabilitado.
 *  3. El tipo de espacio debe ser compatible con el tipo de vehículo.
 *  4. La disponibilidad se actualiza al registrar la entrada.
 * ------------------------------------------------------------------- */
async function registrarEntrada(ctx, { placa, tipo, espacioCodigo, metodoRegistro, confianza }) {
  const resultado = await withTransaction(async (db) => {
    let vehiculo = await vehiculosRepo.bloquearPorPlaca(db, placa);
    let vehiculoNuevo = false;

    if (!vehiculo) {
      if (!tipo) throw AppError.badRequest('El vehículo es nuevo: indique el tipo (AUTO, MOTO o DISCAPACIDAD)');
      vehiculo = await vehiculosRepo.crear(db, { placa, tipo });
      vehiculoNuevo = true;
    }

    const abierta = await vehiculosRepo.tieneSesionAbierta(db, vehiculo.id);
    if (abierta) {
      const s = await repo.buscarPorCodigo(abierta.codigo_ticket, db);
      throw AppError.conflict(
        `El vehículo ${placa} ya tiene una sesión abierta en el espacio ${s.espacio} (ticket ${s.codigo_ticket})`,
        'VEHICULO_CON_SESION_ABIERTA',
      );
    }

    const { ocupacion } = await espaciosRepo.resumen(db);
    let espacio;
    let asignacion;

    if (espacioCodigo) {
      const encontrado = await espaciosRepo.buscarPorCodigo(espacioCodigo, db);
      if (!encontrado) throw AppError.notFound(`El espacio ${espacioCodigo} no existe`);
      espacio = await espaciosRepo.bloquearPorId(db, encontrado.id);
      if (espacio.estado === 'OCUPADO') {
        throw AppError.businessRule(`No se puede asignar el espacio ${espacio.codigo}: está ocupado`, 'ESPACIO_OCUPADO');
      }
      if (espacio.estado === 'INHABILITADO') {
        throw AppError.businessRule(`No se puede asignar el espacio ${espacio.codigo}: está inhabilitado`, 'ESPACIO_INHABILITADO');
      }
      if (!esCompatible(vehiculo.tipo, espacio.tipo)) {
        throw AppError.businessRule(
          `El espacio ${espacio.codigo} es para ${espacio.tipo} y el vehículo es ${vehiculo.tipo}`,
          'ESPACIO_INCOMPATIBLE',
        );
      }
      asignacion = 'MANUAL';
    } else {
      // Asignación automática: espacio libre compatible más cercano a la entrada
      espacio = await espaciosRepo.bloquearMejorLibre(db, tiposEspacioPermitidos(vehiculo.tipo));
      if (!espacio) throw AppError.conflict(`No hay espacios libres para vehículos tipo ${vehiculo.tipo}`, 'SIN_ESPACIOS');
      asignacion = 'AUTOMATICA';
    }

    const sesion = await repo.crear(db, {
      codigo: generarCodigoTicket(),
      vehiculoId: vehiculo.id,
      espacioId: espacio.id,
      usuarioId: ctx.usuario.id,
      ocupacion,
      metodoRegistro,
      confianza,
    });
    await espaciosRepo.cambiarEstado(db, espacio.id, 'OCUPADO');

    await auditoria.registrar(ctx, {
      accion: 'REGISTRAR_ENTRADA', entidad: 'sesiones', registroId: sesion.codigo_ticket,
      detalle: { placa, espacio: espacio.codigo, asignacion, metodoRegistro, confianza, vehiculoNuevo },
    }, db);

    return { sesionId: sesion.id, asignacion, vehiculoNuevo };
  });

  const sesion = await repo.buscarPorId(resultado.sesionId);
  const [tarifa, reglas, resumen] = await Promise.all([
    tarifasRepo.buscarTarifa(sesion.tipo_vehiculo), tarifasRepo.listarReglas(), espaciosRepo.resumen(),
  ]);
  const vigente = tarifaVigente({ tarifa, reglas, ocupacion: Number(sesion.ocupacion_entrada), ahora: new Date(), zonaHoraria: env.tzNegocio });
  const visitas = await vehiculosRepo.contarVisitasCerradas(db0, sesion.vehiculo_id);
  const frecuenteRegla = reglas.find((r) => r.codigo === 'CLIENTE_FRECUENTE');
  const frecuente = Boolean(frecuenteRegla?.activa && visitas >= Number(frecuenteRegla.umbral));

  emitirCambio('entrada', { espacio: sesion.espacio, placa: sesion.placa, ticket: sesion.codigo_ticket, resumen });

  return {
    sesion,
    asignacion: resultado.asignacion,
    vehiculoNuevo: resultado.vehiculoNuevo,
    tarifaVigente: vigente,
    clienteFrecuente: frecuente,
    visitas,
    qr: await generarQrDataUrl(sesion.codigo_ticket),
    urlTicket: urlTicket(sesion.codigo_ticket),
  };
}

/** Calcula el cobro de una sesión abierta con la hora actual. */
async function calcularCobro(sesion, fechaSalida = new Date(), db) {
  const dbq = db || db0;
  const [tarifa, reglas, visitas] = await Promise.all([
    tarifasRepo.buscarTarifa(sesion.tipo_vehiculo, dbq),
    tarifasRepo.listarReglas(dbq),
    vehiculosRepo.contarVisitasCerradas(dbq, sesion.vehiculo_id),
  ]);
  return calcularTarifa({
    fechaEntrada: new Date(sesion.fecha_entrada),
    fechaSalida,
    tarifa,
    reglas,
    ocupacionEntrada: Number(sesion.ocupacion_entrada),
    visitasPrevias: visitas,
    zonaHoraria: env.tzNegocio,
  });
}

/** Regla: solo se puede cobrar o anular una sesión que sigue abierta. */
function validarAbierta(sesion) {
  if (sesion.estado === 'CERRADA') {
    const hora = new Date(sesion.fecha_salida).toLocaleTimeString('es-EC', { timeZone: env.tzNegocio, hour: '2-digit', minute: '2-digit' });
    throw AppError.conflict(`Ticket ya cerrado: este ticket fue cobrado a las ${hora}`, 'TICKET_CERRADO');
  }
  if (sesion.estado === 'ANULADA') throw AppError.conflict('Este ticket fue anulado por el administrador', 'TICKET_ANULADO');
}

/** Vista previa del cobro (al escanear el QR en la salida). */
async function consultarSalida(textoEscaneado) {
  const codigo = await resolverCodigo(textoEscaneado);
  const sesion = await repo.buscarPorCodigo(codigo);
  if (!sesion) throw AppError.notFound(`No existe el ticket ${codigo}`);
  validarAbierta(sesion); // La salida debe corresponder a un ingreso activo
  const calculo = await calcularCobro(sesion);
  return { sesion, calculo };
}

/* -------------------------------------------------------------------
 * REGISTRAR SALIDA Y PAGO (transacción + bloqueo de fila)
 *  - La salida debe corresponder a un ingreso activo.
 *  - El monto lo calcula el backend (el frontend nunca envía el valor).
 *  - Pago + cierre de sesión + liberación del espacio ocurren juntos o no ocurre nada.
 *  - Un ticket no se puede cobrar dos veces (FOR UPDATE + UNIQUE en pagos).
 * ------------------------------------------------------------------- */
async function registrarSalida(ctx, textoEscaneado, { metodo, referencia }) {
  const codigo = await resolverCodigo(textoEscaneado);

  const sesionId = await withTransaction(async (db) => {
    const bloqueada = await repo.bloquearPorCodigo(db, codigo);
    if (!bloqueada) throw AppError.notFound(`No existe el ticket ${codigo}`);
    validarAbierta(bloqueada);

    const sesion = await repo.buscarPorId(bloqueada.id, db);
    const fechaSalida = new Date();
    const calculo = await calcularCobro(sesion, fechaSalida, db);

    await repo.insertarPago(db, {
      sesionId: sesion.id, monto: calculo.total, metodo, referencia, usuarioId: ctx.usuario.id, fecha: fechaSalida,
    });
    await repo.cerrar(db, sesion.id, { usuarioId: ctx.usuario.id, fechaSalida, total: calculo.total, detalle: calculo });
    await espaciosRepo.bloquearPorId(db, sesion.espacio_id);
    await espaciosRepo.cambiarEstado(db, sesion.espacio_id, 'LIBRE');

    await auditoria.registrar(ctx, {
      accion: 'REGISTRAR_SALIDA', entidad: 'sesiones', registroId: codigo,
      detalle: { placa: sesion.placa, espacio: sesion.espacio, total: calculo.total, metodo, minutos: calculo.minutos },
    }, db);
    return sesion.id;
  });

  const sesion = await repo.buscarPorId(sesionId);
  const resumen = await espaciosRepo.resumen();
  emitirCambio('salida', { espacio: sesion.espacio, placa: sesion.placa, ticket: codigo, total: sesion.total, resumen });
  emitirTicket(codigo, { estado: 'CERRADA', total: sesion.total });
  return { sesion, calculo: sesion.detalle_calculo };
}

/** Anula una sesión abierta (solo administrador) y libera su espacio. */
async function anular(ctx, codigo, { motivo }) {
  const sesionId = await withTransaction(async (db) => {
    const bloqueada = await repo.bloquearPorCodigo(db, codigo);
    if (!bloqueada) throw AppError.notFound(`No existe el ticket ${codigo}`);
    validarAbierta(bloqueada);
    await repo.anular(db, bloqueada.id, { usuarioId: ctx.usuario.id, motivo });
    await espaciosRepo.cambiarEstado(db, bloqueada.espacio_id, 'LIBRE');
    await auditoria.registrar(ctx, { accion: 'ANULAR_SESION', entidad: 'sesiones', registroId: codigo, detalle: { motivo } }, db);
    return bloqueada.id;
  });
  const sesion = await repo.buscarPorId(sesionId);
  emitirCambio('anulacion', { espacio: sesion.espacio, ticket: codigo });
  emitirTicket(codigo, { estado: 'ANULADA' });
  return sesion;
}

/** Devuelve una sesión por su código de ticket; 404 si no existe. */
async function detalle(codigo) {
  const sesion = await repo.buscarPorCodigo(extraerCodigo(codigo));
  if (!sesion) throw AppError.notFound('Ticket no encontrado');
  return sesion;
}

/** Ticket de una sesión con su código QR, para volver a mostrarlo o imprimirlo. */
async function verTicket(codigo) {
  const sesion = await detalle(codigo);
  return { sesion, qr: await generarQrDataUrl(sesion.codigo_ticket), urlTicket: urlTicket(sesion.codigo_ticket) };
}

/** Datos públicos del ticket (para la página "Mi ticket" del cliente). Sin datos personales. */
async function ticketPublico(codigo) {
  const sesion = await repo.buscarPorCodigo(extraerCodigo(codigo));
  if (!sesion) throw AppError.notFound('Ticket no encontrado');

  const base = {
    codigo: sesion.codigo_ticket,
    placa: sesion.placa,
    espacio: sesion.espacio,
    zona: sesion.zona,
    tipoVehiculo: sesion.tipo_vehiculo,
    estado: sesion.estado,
    fechaEntrada: sesion.fecha_entrada,
    fechaSalida: sesion.fecha_salida,
    qr: await generarQrDataUrl(sesion.codigo_ticket),
  };
  if (sesion.estado === 'ABIERTA') {
    const calculo = await calcularCobro(sesion);
    const [tarifa, reglas, resumen] = await Promise.all([
      tarifasRepo.buscarTarifa(sesion.tipo_vehiculo), tarifasRepo.listarReglas(), espaciosRepo.resumen(),
    ]);
    return {
      ...base,
      acumulado: calculo.total,
      minutos: calculo.minutos,
      enGracia: calculo.enGracia,
      tarifaVigente: tarifaVigente({ tarifa, reglas, ocupacion: resumen.ocupacion, ahora: new Date(), zonaHoraria: env.tzNegocio }),
      ajustes: calculo.ajustes,
    };
  }
  return { ...base, total: sesion.total, calculo: sesion.detalle_calculo, metodo: sesion.metodo };
}

module.exports = {
  listar, registrarEntrada, consultarSalida, registrarSalida, anular, detalle,
  verTicket, ticketPublico, extraerCodigo,
};
