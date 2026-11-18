import { Link } from 'react-router-dom';
import { ArrowRight, Car, LogIn, LogOut, QrCode, ScanLine } from 'lucide-react';
import { espaciosApi, sesionesApi, tarifasApi } from '../../api/servicios';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import useTiempoReal from '../../hooks/useTiempoReal';
import { Cargando, Insignia } from '../../components/ui';
import { dinero, haceCuanto } from '../../utils/formato';

export default function InicioGuardia() {
  const { usuario } = useAuth();
  const mapa = useApi(() => espaciosApi.mapa(), []);
  const tarifas = useApi(() => tarifasApi.obtener(), []);
  const ultimas = useApi(() => sesionesApi.listar({ usuarioId: usuario.id, limite: 5, ordenarPor: 'fecha_entrada', direccion: 'desc' }), [usuario.id]);
  useTiempoReal(() => { mapa.recargar({ silencioso: true }); ultimas.recargar({ silencioso: true }); tarifas.recargar({ silencioso: true }); });

  const r = mapa.datos?.resumen;
  const tv = tarifas.datos?.vigentes?.find((v) => v.tipoVehiculo === 'AUTO');
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-4">
      <div className="tarjeta p-4">
        <p className="text-xl font-bold">{saludo}, {usuario.nombre.split(' ')[0]} 👋</p>
        <p className="text-sm text-slate-500">Garita principal · Av. de las Américas</p>
      </div>

      <Link to="/guardia/entrada" className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-5 text-white shadow-lg active:scale-[.99]">
        <span className="rounded-xl bg-white/15 p-3"><ScanLine className="h-8 w-8" /></span>
        <div className="flex-1"><p className="text-xl font-extrabold">REGISTRAR ENTRADA</p><p className="text-sm text-green-100">Cámara LPR o ingreso manual</p></div>
        <ArrowRight />
      </Link>
      <Link to="/guardia/salida" className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-marino to-electrico p-5 text-white shadow-lg active:scale-[.99]">
        <span className="rounded-xl bg-white/15 p-3"><QrCode className="h-8 w-8" /></span>
        <div className="flex-1"><p className="text-xl font-extrabold">REGISTRAR SALIDA</p><p className="text-sm text-blue-100">Escanear ticket QR y cobrar</p></div>
        <ArrowRight />
      </Link>

      <div className="tarjeta p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-bold">Ocupación actual</p>
          {tv && <Insignia color={tv.porcentaje > 0 ? 'ambar' : 'marino'}>Tarifa auto {dinero(tv.valorHora)}/h</Insignia>}
        </div>
        {!r ? <Cargando /> : (
          <>
            <div className="mb-2 flex justify-between text-sm"><span className="text-libre-oscuro">● Libres: <b>{r.libres}</b></span><span className="text-ocupado-oscuro">● Ocupados: <b>{r.ocupados}</b></span><b>{Math.round(r.ocupacion)}%</b></div>
            <div className="h-3 overflow-hidden rounded-full bg-libre"><div className="h-3 bg-ocupado transition-all" style={{ width: `${r.ocupacion}%` }} /></div>
          </>
        )}
      </div>

      <div className="tarjeta p-4">
        <p className="mb-3 font-bold">Mis últimas operaciones</p>
        {ultimas.cargando && !ultimas.datos ? <Cargando /> : (ultimas.datos?.datos || []).length === 0 ? <p className="text-sm text-slate-500">Aún no registra operaciones.</p> : (
          <ul className="divide-y divide-slate-100">
            {ultimas.datos.datos.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <span className="rounded-lg bg-slate-100 p-2">{s.estado === 'ABIERTA' ? <LogIn className="h-4 w-4 text-libre-oscuro" /> : s.estado === 'CERRADA' ? <LogOut className="h-4 w-4 text-marino" /> : <Car className="h-4 w-4 text-slate-400" />}</span>
                <div className="flex-1">
                  <p className="placa">{s.placa} <span className="font-sans text-xs font-normal text-slate-500">· {s.espacio}</span></p>
                  <p className="text-xs text-slate-500">{s.estado === 'CERRADA' ? `Cobrado ${dinero(s.total)}` : s.estado === 'ABIERTA' ? 'Dentro del estacionamiento' : 'Anulada'}</p>
                </div>
                <span className="text-xs text-slate-400">{haceCuanto(s.fecha_salida || s.fecha_entrada)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
