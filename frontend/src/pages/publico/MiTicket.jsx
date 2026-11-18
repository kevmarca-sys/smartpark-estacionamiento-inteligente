import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { CheckCircle2, Clock, FileText, MapPin } from 'lucide-react';
import { publicoApi, urlComprobantePublico } from '../../api/servicios';
import { API_URL } from '../../api/http';
import useApi from '../../hooks/useApi';
import Logo from '../../components/Logo';
import DesgloseCobro from '../../components/parqueadero/DesgloseCobro';
import { Cargando, ErrorCarga } from '../../components/ui';
import { dinero, fechaHora, hora } from '../../utils/formato';

function Contador({ desde }) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setAhora(Date.now()), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.floor((ahora - new Date(desde).getTime()) / 1000));
  const f = (n) => String(n).padStart(2, '0');
  return <span>{f(Math.floor(s / 3600))}:{f(Math.floor((s % 3600) / 60))}:{f(s % 60)}</span>;
}

/** Ticket digital del cliente: se abre desde el QR o el enlace del correo, sin iniciar sesión. */
export default function MiTicket() {
  const { codigo } = useParams();
  const { datos, cargando, error, recargar } = useApi(() => publicoApi.ticket(codigo), [codigo]);

  // Actualiza el valor acumulado cada minuto y al instante cuando el ticket es pagado
  useEffect(() => {
    const t = setInterval(() => recargar({ silencioso: true }), 60000);
    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socket.emit('ticket:suscribir', codigo);
    socket.on('ticket:actualizado', () => recargar({ silencioso: true }));
    return () => { clearInterval(t); socket.disconnect(); };
  }, [codigo, recargar]);

  if (cargando && !datos) return <Cargando texto="Cargando su ticket..." />;
  if (error && !datos) return <div className="p-6"><ErrorCarga error={error} alReintentar={recargar} /></div>;
  const t = datos.datos;
  const abierta = t.estado === 'ABIERTA';

  return (
    <div className="min-h-screen bg-lienzo">
      <header className="bg-marino px-5 py-4"><Logo subtitulo="Mi ticket" /></header>
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="tarjeta p-5 text-center">
          {abierta ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Ticket {t.codigo}</p>
              <img src={t.qr} alt="Código QR del ticket" className="mx-auto my-3 h-56 w-56" />
              <p className="text-sm font-semibold text-marino">Presente este código QR en la salida</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-libre" />
              <p className="mt-2 text-xl font-bold">{t.estado === 'CERRADA' ? 'Ticket pagado' : 'Ticket anulado'}</p>
              {t.estado === 'CERRADA' && <p className="text-3xl font-extrabold text-marino">{dinero(t.total)}</p>}
              <p className="text-sm text-slate-500">Salida: {fechaHora(t.fechaSalida)}</p>
            </>
          )}
        </div>

        <div className="tarjeta grid grid-cols-3 gap-2 p-4 text-center">
          <div><p className="text-xs text-slate-500">Placa</p><p className="placa">{t.placa}</p></div>
          <div><p className="text-xs text-slate-500">Espacio</p><p className="flex items-center justify-center gap-1 font-bold"><MapPin className="h-4 w-4 text-electrico" />{t.espacio}</p></div>
          <div><p className="text-xs text-slate-500">Entrada</p><p className="font-bold">{hora(t.fechaEntrada)}</p></div>
        </div>

        {abierta && (
          <div className="rounded-xl2 bg-marino p-5 text-white">
            <p className="flex items-center gap-2 text-sm text-blue-200"><Clock className="h-4 w-4" /> Tiempo transcurrido</p>
            <p className="font-mono text-4xl font-extrabold"><Contador desde={t.fechaEntrada} /></p>
            <div className="mt-3 flex items-end justify-between">
              <div><p className="text-sm text-blue-200">Valor acumulado</p><p className="text-3xl font-extrabold">{dinero(t.acumulado)}</p></div>
              <p className="text-right text-xs text-blue-200">Tarifa vigente<br /><b className="text-base text-white">{dinero(t.tarifaVigente.valorHora)}/h</b></p>
            </div>
            <p className="mt-3 text-xs text-blue-200">{t.enGracia ? 'Está dentro del tiempo de gracia: si sale ahora no paga.' : 'El valor puede variar según la demanda del estacionamiento.'}</p>
          </div>
        )}

        {t.estado === 'CERRADA' && t.calculo && (
          <div className="tarjeta p-4">
            <DesgloseCobro calculo={t.calculo} />
            <a href={urlComprobantePublico(t.codigo)} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-marino py-2.5 text-sm font-semibold text-white">
              <FileText className="h-4 w-4" /> Descargar comprobante PDF
            </a>
          </div>
        )}
        <p className="text-center text-xs text-slate-400">SmartPark · Av. de las Américas, Cuenca – Ecuador</p>
      </main>
    </div>
  );
}
