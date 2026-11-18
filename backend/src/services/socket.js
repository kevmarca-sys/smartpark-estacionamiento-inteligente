const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

let io = null;

/**
 * Tiempo real con Socket.io.
 * El panel del administrador y las pantallas del guardia se actualizan
 * al instante cuando hay una entrada, salida o cambio en un espacio.
 * Los tickets públicos se suscriben a su propia sala "ticket:<codigo>".
 */
function iniciarSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.frontendUrl } });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const datos = jwt.verify(token, env.jwtSecret);
        socket.join('personal');
        socket.data.usuario = datos;
      } catch {
        // token inválido: solo podrá escuchar su ticket público
      }
    }
    socket.on('ticket:suscribir', (codigo) => {
      if (typeof codigo === 'string' && codigo.length < 30) socket.join(`ticket:${codigo}`);
    });
  });

  return io;
}

/** Notifica al personal (admin y guardias) un cambio en el estacionamiento. */
function emitirCambio(evento, datos) {
  if (io) io.to('personal').emit('parqueadero:cambio', { evento, ...datos, fecha: new Date().toISOString() });
}

/** Notifica al cliente que su ticket cambió (pagado / cerrado). */
function emitirTicket(codigo, datos) {
  if (io) io.to(`ticket:${codigo}`).emit('ticket:actualizado', datos);
}

module.exports = { iniciarSocket, emitirCambio, emitirTicket };
