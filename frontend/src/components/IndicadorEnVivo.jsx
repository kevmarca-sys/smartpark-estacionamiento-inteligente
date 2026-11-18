/**
 * Indicador de conexión en tiempo real
 *
 * Muestra "EN VIVO" mientras la conexión con Socket.io está activa.
 */

import { useEffect, useState } from 'react';
import { obtenerSocket } from '../hooks/useTiempoReal';

/** Muestra si la conexión en tiempo real (Socket.io) está activa. */
export default function IndicadorEnVivo() {
  const [conectado, setConectado] = useState(false);
  useEffect(() => {
    const s = obtenerSocket();
    setConectado(s.connected);
    const on = () => setConectado(true);
    const off = () => setConectado(false);
    s.on('connect', on);
    s.on('disconnect', off);
    return () => { s.off('connect', on); s.off('disconnect', off); };
  }, []);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${conectado ? 'bg-libre-claro text-green-800' : 'bg-slate-100 text-slate-500'}`}>
      <span className={`h-2 w-2 rounded-full ${conectado ? 'animate-pulse bg-libre' : 'bg-slate-400'}`} />
      {conectado ? 'EN VIVO' : 'SIN CONEXIÓN'}
    </span>
  );
}
