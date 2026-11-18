import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, Star, UserPlus, X } from 'lucide-react';
import { clientesApi, vehiculosApi } from '../../api/servicios';
import useListado from '../../hooks/useListado';
import useApi from '../../hooks/useApi';
import {
  Boton, Campo, Cargando, EncabezadoPagina, ErrorCarga, EstadoVacio, Insignia, Paginacion, Tabla,
} from '../../components/ui';
import { textoTipo } from '../../utils/constantes';
import FormularioCliente from '../../components/parqueadero/FormularioCliente';
import { dinero, duracion, fechaHora } from '../../utils/formato';

function DetalleVehiculo({ placa, alCerrar }) {
  const { datos, cargando, error, recargar } = useApi(() => vehiculosApi.detalle(placa), [placa]);
  const v = datos?.datos;
  return (
    <div className="tarjeta p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Detalle del vehículo</p>
          <p className="placa text-2xl text-marino">{placa}</p>
        </div>
        <button type="button" onClick={alCerrar} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Cerrar detalle"><X className="h-4 w-4" /></button>
      </div>
      {cargando ? <Cargando /> : error ? <ErrorCarga error={error} alReintentar={recargar} /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Insignia color="marino">{textoTipo(v.tipo)}</Insignia>
            {v.frecuente && <Insignia color="ambar"><Star className="h-3 w-3" /> Frecuente</Insignia>}
            {v.sesionAbierta && <Insignia color="azul" punto>Dentro · {v.sesionAbierta}</Insignia>}
          </div>
          {v.cliente ? (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-semibold">{v.cliente}</p>
              {v.cliente_cedula && <p className="text-slate-500">CI: {v.cliente_cedula}</p>}
              {v.cliente_correo && <p className="flex items-center gap-1 text-slate-500"><Mail className="h-3 w-3" />{v.cliente_correo}</p>}
              {v.cliente_telefono && <p className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" />{v.cliente_telefono}</p>}
            </div>
          ) : <p className="text-sm text-slate-500">Cliente ocasional (sin datos registrados)</p>}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-marino-claro/50 p-2"><p className="text-xl font-bold text-marino">{v.estadisticas.visitas}</p><p className="text-[11px] text-slate-600">Visitas</p></div>
            <div className="rounded-lg bg-marino-claro/50 p-2"><p className="text-xl font-bold text-marino">{dinero(v.estadisticas.total_gastado)}</p><p className="text-[11px] text-slate-600">Gastado</p></div>
            <div className="rounded-lg bg-marino-claro/50 p-2"><p className="text-sm font-bold text-marino">{duracion(v.estadisticas.minutos_promedio)}</p><p className="text-[11px] text-slate-600">Promedio</p></div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Últimas visitas</p>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {v.historial.map((h) => (
                <li key={h.codigo_ticket} className="flex justify-between border-l-2 border-electrico pl-3 text-xs">
                  <span>{fechaHora(h.fecha_entrada)} · {h.espacio}</span>
                  <span className="font-semibold">{h.estado === 'CERRADA' ? dinero(h.total) : h.estado}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Clientes() {
  const [params] = useSearchParams();
  const [pestana, setPestana] = useState('vehiculos');
  const vehiculos = useListado(vehiculosApi.listar, { filtrosIniciales: { q: params.get('q') || '', tipo: '', registrado: '', frecuentes: '' }, ordenInicial: { ordenarPor: 'ultima_visita', direccion: 'desc' } });
  const clientes = useListado(clientesApi.listar, { filtrosIniciales: { q: '' }, ordenInicial: { ordenarPor: 'nombres', direccion: 'asc' } });
  const [seleccion, setSeleccion] = useState(null);
  const [formulario, setFormulario] = useState(false);

  const { cambiarFiltro } = vehiculos;
  useEffect(() => { if (params.get('q')) { setPestana('vehiculos'); cambiarFiltro('q', params.get('q')); } }, [params, cambiarFiltro]);

  const colVehiculos = [
    { clave: 'placa', titulo: 'Placa', ordenable: true, render: (v) => <button type="button" className="placa text-marino hover:underline" onClick={() => setSeleccion(v.placa)}>{v.placa}</button> },
    { clave: 'tipo', titulo: 'Tipo', render: (v) => textoTipo(v.tipo) },
    { clave: 'cliente', titulo: 'Cliente', render: (v) => v.cliente || <span className="text-slate-400">Sin registrar</span> },
    { clave: 'visitas', titulo: 'Visitas', ordenable: true, render: (v) => <span className="flex items-center gap-2">{v.visitas}{v.frecuente && <Insignia color="ambar">Frecuente</Insignia>}</span> },
    { clave: 'ultima_visita', titulo: 'Última visita', ordenable: true, render: (v) => fechaHora(v.ultima_visita) },
    { clave: 'total_gastado', titulo: 'Gastado', ordenable: true, render: (v) => dinero(v.total_gastado) },
    { clave: 'dentro', titulo: 'Estado', render: (v) => (v.dentro ? <Insignia color="azul" punto>Dentro</Insignia> : <Insignia>Fuera</Insignia>) },
  ];
  const colClientes = [
    { clave: 'nombres', titulo: 'Nombre', ordenable: true, render: (c) => <span className="font-semibold">{c.nombres}</span> },
    { clave: 'cedula', titulo: 'Cédula', render: (c) => c.cedula || '—' },
    { clave: 'correo', titulo: 'Correo', render: (c) => c.correo || '—' },
    { clave: 'telefono', titulo: 'Teléfono', render: (c) => c.telefono || '—' },
    { clave: 'placas', titulo: 'Vehículos', render: (c) => <div className="flex gap-1">{c.placas.map((p) => <button type="button" key={p} onClick={() => setSeleccion(p)} className="placa rounded bg-slate-100 px-1.5 text-xs hover:bg-marino-claro">{p}</button>)}</div> },
    { clave: 'visitas', titulo: 'Visitas', ordenable: true },
  ];

  const activa = pestana === 'vehiculos' ? vehiculos : clientes;

  return (
    <div>
      <EncabezadoPagina titulo="Clientes y vehículos" descripcion="Los vehículos se reconocen por su placa: el cliente se registra una sola vez"
        acciones={<Boton icono={UserPlus} onClick={() => setFormulario(true)}>Registrar cliente</Boton>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="tarjeta">
          <div className="flex gap-1 border-b border-slate-100 px-4 pt-3" role="tablist">
            {[['vehiculos', 'Vehículos'], ['clientes', 'Clientes']].map(([k, t]) => (
              <button key={k} type="button" role="tab" aria-selected={pestana === k} onClick={() => setPestana(k)}
                className={`border-b-2 px-4 py-2 text-sm font-semibold ${pestana === k ? 'border-electrico text-marino' : 'border-transparent text-slate-500'}`}>
                {t}{activa === (k === 'vehiculos' ? vehiculos : clientes) && activa.paginacion ? ` (${activa.paginacion.total})` : ''}
              </button>
            ))}
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-4">
            <Campo className="md:col-span-2" placeholder={pestana === 'vehiculos' ? 'Buscar placa, cliente o cédula...' : 'Buscar nombre, cédula, correo o placa...'}
              value={activa.filtros.q} onChange={(e) => activa.cambiarFiltro('q', e.target.value)} aria-label="Buscar" />
            {pestana === 'vehiculos' && (
              <>
                <Campo como="select" value={vehiculos.filtros.registrado} onChange={(e) => vehiculos.cambiarFiltro('registrado', e.target.value)} aria-label="Registro"
                  opciones={[{ valor: '', texto: 'Todos' }, { valor: 'true', texto: 'Con cliente registrado' }, { valor: 'false', texto: 'Ocasionales' }]} />
                <Campo como="select" value={vehiculos.filtros.frecuentes} onChange={(e) => vehiculos.cambiarFiltro('frecuentes', e.target.value)} aria-label="Frecuentes"
                  opciones={[{ valor: '', texto: 'Todas las frecuencias' }, { valor: 'true', texto: 'Solo frecuentes' }]} />
              </>
            )}
          </div>
          {activa.cargando ? <Cargando /> : activa.error ? <ErrorCarga error={activa.error} alReintentar={activa.recargar} />
            : activa.filas.length === 0 ? <EstadoVacio />
              : <Tabla columnas={pestana === 'vehiculos' ? colVehiculos : colClientes} filas={activa.filas} orden={activa.orden} alOrdenar={activa.ordenarPor} />}
          <Paginacion paginacion={activa.paginacion} alCambiar={activa.setPagina} />
        </div>
        <div>
          {seleccion ? <DetalleVehiculo placa={seleccion} alCerrar={() => setSeleccion(null)} />
            : <div className="tarjeta p-6 text-center text-sm text-slate-500">Seleccione una placa para ver su historial, estadísticas y datos del cliente.</div>}
        </div>
      </div>
      {formulario && <FormularioCliente alCerrar={() => setFormulario(false)} alGuardar={() => { setFormulario(false); vehiculos.recargar({ silencioso: true }); clientes.recargar({ silencioso: true }); }} />}
    </div>
  );
}
