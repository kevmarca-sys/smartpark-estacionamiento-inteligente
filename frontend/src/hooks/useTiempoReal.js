import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL, almacenToken } from '../api/http';

let socketCompartido = null;

export function obtenerSocket() {
  if (!socketCompartido) {
    socketCompartido = io(API_URL, { auth: { token: almacenToken.obtener() }, transports: ['websocket', 'polling'] });
  }
  return socketCompartido;
}

export function reiniciarSocket() {
  if (socketCompartido) socketCompartido.disconnect();
  socketCompartido = null;
}

/**
 * Escucha los cambios del estacionamiento en tiempo real (entradas, salidas, espacios).
 * El panel se actualiza sin recargar la página.
 */
export default function useTiempoReal(alCambiar) {
  const ref = useRef(alCambiar);
  ref.current = alCambiar;

  useEffect(() => {
    const socket = obtenerSocket();
    const manejar = (evento) => ref.current?.(evento);
    socket.on('parqueadero:cambio', manejar);
    return () => socket.off('parqueadero:cambio', manejar);
  }, []);
}
