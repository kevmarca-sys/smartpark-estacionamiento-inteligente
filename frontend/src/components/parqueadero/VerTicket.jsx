/**
 * Ventana para ver un ticket
 *
 * Consulta el ticket de una sesión con su código QR para volver a mostrarlo al
 * cliente o imprimirlo. La usan el administrador y el guardia.
 */

import { Printer } from 'lucide-react';
import { sesionesApi } from '../../api/servicios';
import useApi from '../../hooks/useApi';
import { Boton, Cargando, ErrorCarga, Insignia, Modal } from '../ui';
import TicketQR from './TicketQR';
import { ESTADOS_SESION } from '../../utils/constantes';
import { dinero, duracion, fechaHora } from '../../utils/formato';

export default function VerTicket({ codigo, alCerrar }) {
  const ticket = useApi(() => sesionesApi.ticket(codigo), [codigo]);
  const t = ticket.datos?.datos;
  const s = t?.sesion;
  const estado = s && ESTADOS_SESION[s.estado];

  return (
    <Modal abierto titulo="Ticket" subtitulo={codigo} alCerrar={alCerrar}
      pie={(
        <>
          <Boton variante="secundario" onClick={alCerrar}>Cerrar</Boton>
          {s?.estado === 'ABIERTA' && <Boton icono={Printer} onClick={() => window.print()}>Imprimir</Boton>}
        </>
      )}>
      {ticket.cargando && !ticket.datos && <Cargando texto="Cargando ticket..." />}
      {ticket.error && <ErrorCarga error={ticket.error} alReintentar={() => ticket.recargar()} />}
      {s && (
        <div className="space-y-3">
          <div className="flex justify-center"><Insignia color={estado.color}>{estado.texto}</Insignia></div>
          <div id="ticket-imprimible"><TicketQR sesion={s} qr={s.estado === 'ABIERTA' ? t.qr : null} /></div>
          {s.estado !== 'ABIERTA' && (
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
              <div><p className="text-slate-500">Salida</p><p className="font-semibold">{fechaHora(s.fecha_salida)}</p></div>
              <div><p className="text-slate-500">Tiempo</p><p className="font-semibold">{duracion(s.minutos)}</p></div>
              <div><p className="text-slate-500">Total</p><p className="font-semibold">{s.total !== null ? dinero(s.total) : '—'}</p></div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
