import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Car, DollarSign, Gauge, History, LogIn, LogOut, ParkingSquare, Wrench, Zap } from 'lucide-react';
import { espaciosApi, reportesApi } from '../../api/servicios';
import useApi from '../../hooks/useApi';
import useTiempoReal from '../../hooks/useTiempoReal';
import MapaEspacios, { LeyendaMapa } from '../../components/parqueadero/MapaEspacios';
import { Cargando, ErrorCarga, TarjetaIndicador } from '../../components/ui';
import { dinero, duracion, haceCuanto } from '../../utils/formato';
import { ACCIONES_AUDITORIA } from '../../utils/constantes';

const ICONO_ACTIVIDAD = { REGISTRAR_ENTRADA: LogIn, REGISTRAR_SALIDA: LogOut, INHABILITAR_ESPACIO: Wrench, HABILITAR_ESPACIO: ParkingSquare };

function textoActividad(a) {
  const d = a.detalle || {};
  switch (a.accion) {
    case 'REGISTRAR_ENTRADA': return `Ingresó al ${d.espacio} · ${a.usuario_nombre}`;
    case 'REGISTRAR_SALIDA': return `Salió del ${d.espacio} · cobrado ${dinero(d.total)}`;
    case 'INHABILITAR_ESPACIO': return `Espacio inhabilitado: ${d.motivo || ''}`;
    case 'HABILITAR_ESPACIO': return 'Espacio habilitado';
    default: return ACCIONES_AUDITORIA[a.accion]?.texto || a.accion;
  }
}

export default function Dashboard() {
  const indicadores = useApi(() => reportesApi.dashboard(), []);
  const mapa = useApi(() => espaciosApi.mapa(), []);
  const [resaltado, setResaltado] = useState(null);

  // Tiempo real: cuando entra o sale un vehículo se actualiza todo sin recargar la página
  useTiempoReal((evento) => {
    indicadores.recargar({ silencioso: true });
    mapa.recargar({ silencioso: true });
    if (evento.espacio) {
      setResaltado(evento.espacio);
      setTimeout(() => setResaltado(null), 3500);
    }
  });

  if (indicadores.cargando && !indicadores.datos) return <Cargando texto="Cargando panel en vivo..." />;
  if (indicadores.error && !indicadores.datos) return <ErrorCarga error={indicadores.error} alReintentar={indicadores.recargar} />;

  const d = indicadores.datos.datos;
  const { espacios, ingresos, tarifaVigente: tv } = d;
  const operativos = espacios.total - espacios.inhabilitados;
  const sube = (ingresos.variacion ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaIndicador titulo="Espacios libres" valor={`${espacios.libres}/${operativos}`} icono={ParkingSquare}
          color="bg-libre-claro text-libre-oscuro" detalle={`${espacios.inhabilitados} inhabilitados`} barra={(espacios.libres / Math.max(1, operativos)) * 100} />
        <TarjetaIndicador titulo="Ocupación" valor={`${Math.round(espacios.ocupacion)}%`} icono={Gauge} detalle={`${espacios.ocupados} ocupados`} barra={espacios.ocupacion} />
        <TarjetaIndicador titulo="Ingresos de hoy" valor={dinero(ingresos.hoy)} icono={DollarSign} color="bg-blue-100 text-electrico-oscuro"
          detalle={(
            <span className="flex items-center gap-1">
              {ingresos.variacion !== null && (
                <span className={`flex items-center font-semibold ${sube ? 'text-libre-oscuro' : 'text-ocupado-oscuro'}`}>
                  {sube ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(ingresos.variacion)}% vs ayer ·
                </span>
              )}
              {ingresos.transacciones} cobros
            </span>
          )} />
        <TarjetaIndicador titulo="Vehículos dentro" valor={espacios.ocupados} icono={Car} detalle={`Estadía promedio: ${duracion(d.estadiaPromedioMin)}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="tarjeta p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">Mapa del estacionamiento</h2>
              <p className="text-xs text-slate-500">Supervisión en tiempo real de los espacios</p>
            </div>
            <LeyendaMapa />
          </div>
          {mapa.datos ? <MapaEspacios espacios={mapa.datos.espacios} resaltado={resaltado} /> : <Cargando />}
        </div>

        <div className="tarjeta flex flex-col p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><History className="h-5 w-5 text-marino" /> Actividad reciente</h2>
          {d.actividad.length === 0 ? <p className="text-sm text-slate-500">Aún no hay movimientos.</p> : (
            <ul className="flex-1 space-y-3">
              {d.actividad.map((a) => {
                const Icono = ICONO_ACTIVIDAD[a.accion] || History;
                return (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-0.5 rounded-lg bg-slate-100 p-2"><Icono className="h-4 w-4 text-marino" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="placa truncate text-sm">{a.detalle?.placa || a.registro_id}</p>
                        <span className="shrink-0 text-xs text-slate-400">{haceCuanto(a.fecha)}</span>
                      </div>
                      <p className="truncate text-xs text-slate-500">{textoActividad(a)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link to="/admin/auditoria" className="mt-4 text-center text-sm font-semibold text-electrico">Ver auditoría completa</Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="tarjeta p-5">
          <h2 className="text-lg font-bold">Ocupación por hora del día</h2>
          <p className="mb-4 text-xs text-slate-500">Porcentaje de espacios ocupados hoy (06:00 – 22:00)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.ocupacionPorHora} margin={{ left: -15, right: 10 }}>
                <defs>
                  <linearGradient id="gOcupacion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Ocupación']} />
                <Area type="monotone" dataKey="ocupacion" stroke="#1E3A8A" strokeWidth={2.5} fill="url(#gOcupacion)" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col rounded-xl2 bg-marino p-5 text-white shadow-suave">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tv.porcentaje > 0 ? 'bg-alerta text-tinta' : tv.porcentaje < 0 ? 'bg-libre text-tinta' : 'bg-white/15'}`}>
              {tv.porcentaje > 0 ? 'RECARGO ACTIVO' : tv.porcentaje < 0 ? 'DESCUENTO ACTIVO' : 'TARIFA NORMAL'}
            </span>
            <Zap className="h-5 w-5 text-alerta" />
          </div>
          <p className="mt-4 text-sm text-blue-200">Tarifa dinámica actual (auto)</p>
          <p className="text-4xl font-extrabold">{dinero(tv.valorHora)}<span className="text-base font-medium text-blue-200"> / hora</span></p>
          <div className="mt-4 space-y-1.5 rounded-lg bg-white/10 p-3 text-xs">
            <div className="flex justify-between"><span className="text-blue-100">Tarifa base</span><span className="font-semibold">{dinero(tv.base)}/h</span></div>
            {tv.ajustes.length === 0 && <p className="text-blue-200">Sin ajustes en este momento</p>}
            {tv.ajustes.map((a) => (
              <div key={a.codigo} className="flex justify-between"><span className="text-blue-100">{a.nombre}</span><span className="font-semibold">{a.porcentaje > 0 ? '+' : ''}{a.porcentaje}%</span></div>
            ))}
          </div>
          <Link to="/admin/tarifas" className="mt-auto pt-4">
            <span className="block rounded-lg bg-electrico py-2.5 text-center text-sm font-semibold">Ajustar configuración de tarifas</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
