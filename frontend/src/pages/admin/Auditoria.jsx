import { auditoriaApi, usuariosApi } from '../../api/servicios';
import useListado from '../../hooks/useListado';
import useApi from '../../hooks/useApi';
import { Campo, Cargando, EncabezadoPagina, ErrorCarga, EstadoVacio, Insignia, Paginacion, Tabla } from '../../components/ui';
import { ACCIONES_AUDITORIA } from '../../utils/constantes';
import { fechaHora, hoyISO } from '../../utils/formato';

function resumirDetalle(d) {
  if (!d) return '—';
  if (d.antes && d.despues) {
    const claves = Object.keys(d.despues).filter((k) => JSON.stringify(d.antes[k]) !== JSON.stringify(d.despues[k]));
    if (claves.length) return claves.map((k) => `${k}: ${d.antes[k] ?? '—'} → ${d.despues[k] ?? '—'}`).join(' · ');
  }
  return Object.entries(d).filter(([k]) => !['antes', 'despues'].includes(k)).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ');
}

export default function Auditoria() {
  const usuarios = useApi(() => usuariosApi.listar({ limite: 100 }), []);
  const lista = useListado(auditoriaApi.listar, {
    filtrosIniciales: { q: '', accion: '', usuarioId: '', desde: hoyISO(7), hasta: hoyISO(0) },
    ordenInicial: { ordenarPor: 'fecha', direccion: 'desc' }, limite: 15,
  });

  const columnas = [
    { clave: 'fecha', titulo: 'Fecha y hora', ordenable: true, render: (a) => fechaHora(a.fecha) },
    { clave: 'usuario', titulo: 'Usuario', ordenable: true, render: (a) => <div><p className="font-semibold">{a.usuario_nombre || 'Anónimo'}</p><p className="text-xs text-slate-500">{a.rol || '—'}</p></div> },
    { clave: 'accion', titulo: 'Acción', ordenable: true, render: (a) => <Insignia color={ACCIONES_AUDITORIA[a.accion]?.color || 'gris'}>{ACCIONES_AUDITORIA[a.accion]?.texto || a.accion}</Insignia> },
    { clave: 'registro_id', titulo: 'Registro afectado', render: (a) => <span className="font-mono text-xs">{a.entidad} · {a.registro_id || '—'}</span> },
    { clave: 'detalle', titulo: 'Detalle', render: (a) => <span className="block max-w-md truncate text-xs text-slate-600" title={resumirDetalle(a.detalle)}>{resumirDetalle(a.detalle)}</span> },
    { clave: 'ip', titulo: 'IP', render: (a) => <span className="text-xs text-slate-500">{a.ip || '—'}</span> },
  ];

  return (
    <div>
      <EncabezadoPagina titulo="Auditoría y trazabilidad" descripcion="Registro de las operaciones importantes: quién, cuándo, qué acción y sobre qué registro" />
      <div className="tarjeta">
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-5">
          <Campo placeholder="Buscar ticket, placa, texto..." value={lista.filtros.q} onChange={(e) => lista.cambiarFiltro('q', e.target.value)} aria-label="Buscar" />
          <Campo como="select" value={lista.filtros.accion} onChange={(e) => lista.cambiarFiltro('accion', e.target.value)} aria-label="Acción"
            opciones={[{ valor: '', texto: 'Todas las acciones' }, ...Object.entries(ACCIONES_AUDITORIA).map(([k, v]) => ({ valor: k, texto: v.texto }))]} />
          <Campo como="select" value={lista.filtros.usuarioId} onChange={(e) => lista.cambiarFiltro('usuarioId', e.target.value)} aria-label="Usuario"
            opciones={[{ valor: '', texto: 'Todos los usuarios' }, ...(usuarios.datos?.datos || []).map((u) => ({ valor: String(u.id), texto: u.nombre }))]} />
          <Campo type="date" value={lista.filtros.desde} onChange={(e) => lista.cambiarFiltro('desde', e.target.value)} aria-label="Desde" />
          <Campo type="date" value={lista.filtros.hasta} onChange={(e) => lista.cambiarFiltro('hasta', e.target.value)} aria-label="Hasta" />
        </div>
        {lista.cargando ? <Cargando /> : lista.error ? <ErrorCarga error={lista.error} alReintentar={lista.recargar} />
          : lista.filas.length === 0 ? <EstadoVacio /> : <Tabla columnas={columnas} filas={lista.filas} orden={lista.orden} alOrdenar={lista.ordenarPor} />}
        <Paginacion paginacion={lista.paginacion} alCambiar={lista.setPagina} />
      </div>
    </div>
  );
}
