import { useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, XCircle } from 'lucide-react';
import { abrirPdf, sesionesApi } from '../../api/servicios';
import useListado from '../../hooks/useListado';
import useTiempoReal from '../../hooks/useTiempoReal';
import {
  Boton, Campo, Cargando, Confirmar, EncabezadoPagina, ErrorCarga, EstadoVacio, Insignia, Paginacion, Tabla,
} from '../../components/ui';
import { ESTADOS_SESION, TIPOS_VEHICULO } from '../../utils/constantes';
import { dinero, duracion, fechaHora, hoyISO } from '../../utils/formato';

const FILTROS = { q: '', estado: '', desde: hoyISO(13), hasta: hoyISO(0), metodo: '', tipoVehiculo: '' };

export default function Sesiones() {
  const lista = useListado(sesionesApi.listar, { filtrosIniciales: FILTROS, ordenInicial: { ordenarPor: 'fecha_entrada', direccion: 'desc' } });
  const [anular, setAnular] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);
  useTiempoReal(() => lista.recargar({ silencioso: true }));

  async function confirmarAnulacion() {
    if (motivo.trim().length < 10) { toast.error('Explique el motivo (mínimo 10 caracteres)'); return; }
    setProcesando(true);
    try {
      const r = await sesionesApi.anular(anular.codigo_ticket, motivo.trim());
      toast.success(r.mensaje);
      setAnular(null); setMotivo('');
      lista.recargar({ silencioso: true });
    } catch (e) { toast.error(e.mensaje); } finally { setProcesando(false); }
  }

  const pdf = (s) => abrirPdf(`/sesiones/${s.codigo_ticket}/comprobante`).catch((e) => toast.error(e.mensaje || 'No se pudo abrir el PDF'));

  const columnas = [
    { clave: 'codigo_ticket', titulo: 'Ticket', render: (s) => <span className="font-mono text-xs font-semibold">{s.codigo_ticket}</span> },
    { clave: 'placa', titulo: 'Placa', ordenable: true, render: (s) => <div><p className="placa">{s.placa}</p>{s.cliente && <p className="text-xs text-slate-500">{s.cliente}</p>}</div> },
    { clave: 'espacio', titulo: 'Espacio', ordenable: true },
    { clave: 'fecha_entrada', titulo: 'Entrada', ordenable: true, render: (s) => fechaHora(s.fecha_entrada) },
    { clave: 'fecha_salida', titulo: 'Salida', render: (s) => fechaHora(s.fecha_salida) },
    { clave: 'minutos', titulo: 'Tiempo', ordenable: true, render: (s) => duracion(s.minutos) },
    { clave: 'total', titulo: 'Total', ordenable: true, render: (s) => (s.total !== null ? <b>{dinero(s.total)}</b> : '—') },
    { clave: 'metodo', titulo: 'Pago', render: (s) => (s.metodo ? <span className="text-xs">{s.metodo === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'}</span> : '—') },
    { clave: 'estado', titulo: 'Estado', render: (s) => <Insignia color={ESTADOS_SESION[s.estado].color}>{ESTADOS_SESION[s.estado].texto}</Insignia> },
    { clave: 'guardia', titulo: 'Guardia', render: (s) => <span className="text-xs">{s.cobrador || s.guardia_entrada}</span> },
    {
      clave: 'acciones', titulo: '', render: (s) => (
        <div className="flex gap-1">
          {s.estado === 'CERRADA' && <button type="button" onClick={() => pdf(s)} className="rounded p-1.5 text-marino hover:bg-marino-claro" title="Comprobante PDF" aria-label="Comprobante PDF"><FileText className="h-4 w-4" /></button>}
          {s.estado === 'ABIERTA' && <button type="button" onClick={() => setAnular(s)} className="rounded p-1.5 text-ocupado hover:bg-ocupado-claro" title="Anular" aria-label="Anular sesión"><XCircle className="h-4 w-4" /></button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <EncabezadoPagina titulo="Historial de sesiones" descripcion="Entradas, salidas y cobros registrados"
        acciones={lista.datos && <Insignia color="verde" className="!text-sm">Total recaudado en el filtro: {dinero(lista.datos.totalRecaudado)}</Insignia>} />
      <div className="tarjeta">
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-3 xl:grid-cols-6">
          <Campo placeholder="Placa, ticket o cliente..." value={lista.filtros.q} onChange={(e) => lista.cambiarFiltro('q', e.target.value)} aria-label="Buscar" />
          <Campo type="date" value={lista.filtros.desde} onChange={(e) => lista.cambiarFiltro('desde', e.target.value)} aria-label="Desde" />
          <Campo type="date" value={lista.filtros.hasta} onChange={(e) => lista.cambiarFiltro('hasta', e.target.value)} aria-label="Hasta" />
          <Campo como="select" value={lista.filtros.estado} onChange={(e) => lista.cambiarFiltro('estado', e.target.value)} aria-label="Estado"
            opciones={[{ valor: '', texto: 'Todos los estados' }, { valor: 'ABIERTA', texto: 'Abierta' }, { valor: 'CERRADA', texto: 'Cerrada' }, { valor: 'ANULADA', texto: 'Anulada' }]} />
          <Campo como="select" value={lista.filtros.metodo} onChange={(e) => lista.cambiarFiltro('metodo', e.target.value)} aria-label="Método de pago"
            opciones={[{ valor: '', texto: 'Todo método de pago' }, { valor: 'EFECTIVO', texto: 'Efectivo' }, { valor: 'TRANSFERENCIA', texto: 'Transferencia' }]} />
          <Campo como="select" value={lista.filtros.tipoVehiculo} onChange={(e) => lista.cambiarFiltro('tipoVehiculo', e.target.value)} aria-label="Tipo"
            opciones={[{ valor: '', texto: 'Todos los vehículos' }, ...TIPOS_VEHICULO]} />
        </div>
        {lista.cargando ? <Cargando /> : lista.error ? <ErrorCarga error={lista.error} alReintentar={lista.recargar} />
          : lista.filas.length === 0 ? <EstadoVacio titulo="No se encontraron sesiones" texto="Pruebe con otro rango de fechas o quite filtros" accion={<Boton variante="secundario" tamano="sm" onClick={lista.limpiarFiltros}>Limpiar filtros</Boton>} />
            : <Tabla columnas={columnas} filas={lista.filas} orden={lista.orden} alOrdenar={lista.ordenarPor} />}
        <Paginacion paginacion={lista.paginacion} alCambiar={lista.setPagina} />
      </div>

      <Confirmar abierto={Boolean(anular)} titulo="Anular sesión" textoConfirmar="Anular y liberar espacio" cargando={procesando}
        mensaje={anular && `Se anulará el ticket ${anular.codigo_ticket} de la placa ${anular.placa} y se liberará el espacio ${anular.espacio} sin cobrar.`}
        alConfirmar={confirmarAnulacion} alCancelar={() => { setAnular(null); setMotivo(''); }}>
        <Campo className="mt-3" como="textarea" rows={2} etiqueta="Motivo" required value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: registro duplicado por error del guardia" />
      </Confirmar>
    </div>
  );
}
