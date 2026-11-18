import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Clock, DollarSign, FileDown, Gauge, Receipt } from 'lucide-react';
import { abrirPdf, reportesApi } from '../../api/servicios';
import useApi from '../../hooks/useApi';
import { Boton, Campo, Cargando, EncabezadoPagina, ErrorCarga, EstadoVacio, TarjetaIndicador } from '../../components/ui';
import { TIPOS_VEHICULO, textoTipo } from '../../utils/constantes';
import { dinero, duracion, fechaCorta, hoyISO } from '../../utils/formato';

const COLORES = ['#1E3A8A', '#3B82F6', '#22C55E', '#F59E0B'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function MapaCalor({ datos }) {
  const horas = Array.from({ length: 15 }, (_, i) => i + 7);
  const max = Math.max(1, ...datos.map((d) => d.entradas));
  const valor = (dia, hora) => datos.find((d) => d.dia === dia && d.hora === hora)?.entradas || 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-[10px]">
        <thead><tr><th />{horas.map((h) => <th key={h} className="font-medium text-slate-500">{h}h</th>)}</tr></thead>
        <tbody>
          {DIAS.map((d, i) => (
            <tr key={d}>
              <th className="pr-1 text-right font-medium text-slate-500">{d}</th>
              {horas.map((h) => {
                const v = valor(i + 1, h);
                return <td key={h} title={`${d} ${h}:00 · ${v} entradas`} className="h-6 min-w-6 rounded" style={{ background: v ? `rgba(30,58,138,${0.12 + (v / max) * 0.88})` : '#f1f5f9' }} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reportes() {
  const [filtros, setFiltros] = useState({ desde: hoyISO(13), hasta: hoyISO(0), tipoVehiculo: '', zona: '' });
  const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
  const { datos, cargando, error, recargar } = useApi(() => reportesApi.resumen(params), [JSON.stringify(params)]);
  const [exportando, setExportando] = useState(false);
  const cambiar = (c) => (e) => setFiltros({ ...filtros, [c]: e.target.value });

  async function exportar() {
    setExportando(true);
    try { await abrirPdf('/reportes/pdf', params); } catch (e) { toast.error(e.mensaje || 'No se pudo generar el PDF'); } finally { setExportando(false); }
  }

  const r = datos?.datos;
  const porDia = r?.porDia.map((d) => ({ ...d, ingresos: Number(d.ingresos), etiqueta: fechaCorta(d.dia) })) || [];
  const porHora = Array.from({ length: 24 }, (_, h) => ({ hora: `${h}h`, entradas: r?.porHora.find((x) => x.hora === h)?.entradas || 0 })).slice(6, 23);

  return (
    <div className="space-y-6">
      <EncabezadoPagina titulo="Reportes y analítica" descripcion="Ingresos, ocupación y comportamiento de los clientes"
        acciones={<Boton icono={FileDown} cargando={exportando} onClick={exportar}>Exportar PDF</Boton>} />
      <div className="tarjeta grid gap-3 p-4 md:grid-cols-4">
        <Campo type="date" etiqueta="Desde" value={filtros.desde} onChange={cambiar('desde')} />
        <Campo type="date" etiqueta="Hasta" value={filtros.hasta} onChange={cambiar('hasta')} />
        <Campo como="select" etiqueta="Tipo de vehículo" value={filtros.tipoVehiculo} onChange={cambiar('tipoVehiculo')} opciones={[{ valor: '', texto: 'Todos' }, ...TIPOS_VEHICULO]} />
        <Campo como="select" etiqueta="Zona" value={filtros.zona} onChange={cambiar('zona')} opciones={[{ valor: '', texto: 'Todas' }, { valor: 'A', texto: 'Sección A' }, { valor: 'B', texto: 'Sección B' }]} />
      </div>

      {cargando && !r ? <Cargando /> : error ? <ErrorCarga error={error} alReintentar={recargar} /> : r.resumen.sesiones === 0 ? <div className="tarjeta"><EstadoVacio texto="No hay sesiones cerradas en este rango" /></div> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <TarjetaIndicador titulo="Ingresos totales" valor={dinero(r.resumen.ingresos)} icono={DollarSign} />
            <TarjetaIndicador titulo="Sesiones" valor={r.resumen.sesiones} icono={Receipt} detalle={`Ticket promedio ${dinero(r.resumen.ticketPromedio)}`} />
            <TarjetaIndicador titulo="Permanencia promedio" valor={duracion(r.resumen.minutosPromedio)} icono={Clock} />
            <TarjetaIndicador titulo="Ocupación promedio al ingresar" valor={`${r.resumen.ocupacionPromedio}%`} icono={Gauge} barra={Number(r.resumen.ocupacionPromedio)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="tarjeta p-5">
              <h2 className="mb-4 font-bold">Ingresos por día</h2>
              <div className="h-64"><ResponsiveContainer>
                <BarChart data={porDia} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, n) => (n === 'ingresos' ? [dinero(v), 'Ingresos'] : [v, 'Sesiones'])} />
                  <Bar dataKey="ingresos" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer></div>
            </div>
            <div className="tarjeta p-5">
              <h2 className="mb-4 font-bold">Entradas por hora del día</h2>
              <div className="h-64"><ResponsiveContainer>
                <LineChart data={porHora} margin={{ left: -15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="hora" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Entradas']} />
                  <Line type="monotone" dataKey="entradas" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer></div>
            </div>
            <div className="tarjeta p-5">
              <h2 className="mb-4 font-bold">Sesiones por tipo de vehículo</h2>
              <div className="h-64"><ResponsiveContainer>
                <PieChart>
                  <Pie data={r.porTipo.map((t) => ({ name: textoTipo(t.tipo), value: t.sesiones }))} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {r.porTipo.map((t, i) => <Cell key={t.tipo} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer></div>
            </div>
            <div className="tarjeta p-5">
              <h2 className="mb-1 font-bold">Horas pico por día de la semana</h2>
              <p className="mb-3 text-xs text-slate-500">Más oscuro = más entradas</p>
              <MapaCalor datos={r.mapaCalor} />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="tarjeta p-5">
              <h2 className="mb-3 font-bold">Top 5 clientes frecuentes</h2>
              <table className="tabla w-full"><thead><tr><th>#</th><th>Placa</th><th>Cliente</th><th>Visitas</th><th>Gastado</th></tr></thead>
                <tbody>{r.topClientes.map((c, i) => (
                  <tr key={c.placa}><td>{i + 1}</td><td className="placa">{c.placa}</td><td>{c.cliente || <span className="text-slate-400">Ocasional</span>}</td><td>{c.visitas}</td><td>{dinero(c.gastado)}</td></tr>
                ))}</tbody>
              </table>
            </div>
            <div className="tarjeta p-5">
              <h2 className="mb-3 font-bold">Ingresos por método de pago</h2>
              <table className="tabla w-full"><thead><tr><th>Método</th><th>Sesiones</th><th>Ingresos</th></tr></thead>
                <tbody>{r.porMetodo.map((m) => (
                  <tr key={m.metodo}><td>{m.metodo === 'EFECTIVO' ? 'Efectivo' : m.metodo === 'TRANSFERENCIA' ? 'Transferencia' : m.metodo}</td><td>{m.sesiones}</td><td className="font-semibold">{dinero(m.ingresos)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
