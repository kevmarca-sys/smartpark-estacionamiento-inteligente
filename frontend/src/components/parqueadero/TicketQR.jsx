import { dinero, hora } from '../../utils/formato';

export default function TicketQR({ sesion, qr, tarifaHora }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Ticket digital</p>
      <p className="mt-1 font-mono text-lg font-bold text-marino">{sesion.codigo_ticket}</p>
      {qr && <img src={qr} alt={`Código QR del ticket ${sesion.codigo_ticket}`} className="mx-auto my-3 h-48 w-48" />}
      <div className="grid grid-cols-3 gap-2 text-left text-xs">
        <div><p className="text-slate-500">Placa</p><p className="placa text-sm">{sesion.placa}</p></div>
        <div><p className="text-slate-500">Espacio</p><p className="text-sm font-bold">{sesion.espacio}</p></div>
        <div><p className="text-slate-500">Entrada</p><p className="text-sm font-bold">{hora(sesion.fecha_entrada)}</p></div>
      </div>
      {tarifaHora !== undefined && <p className="mt-3 text-xs text-slate-500">Tarifa vigente: <b>{dinero(tarifaHora)}/hora</b></p>}
      <p className="mt-1 text-[11px] text-slate-400">Presente este código QR en la salida</p>
    </div>
  );
}
