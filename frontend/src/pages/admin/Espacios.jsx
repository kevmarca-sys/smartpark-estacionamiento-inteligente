import { useState } from 'react';
import toast from 'react-hot-toast';
import { Ban, CheckCircle2, LayoutGrid, List, Pencil, Plus, Trash2 } from 'lucide-react';
import { espaciosApi } from '../../api/servicios';
import { erroresPorCampo } from '../../api/http';
import useListado from '../../hooks/useListado';
import useApi from '../../hooks/useApi';
import useTiempoReal from '../../hooks/useTiempoReal';
import MapaEspacios, { LeyendaMapa } from '../../components/parqueadero/MapaEspacios';
import {
  Boton, Campo, Cargando, Confirmar, EncabezadoPagina, ErrorCarga, EstadoVacio, Insignia, Modal, Paginacion, Tabla,
} from '../../components/ui';
import { ESTADOS_ESPACIO, TIPOS_VEHICULO, textoTipo } from '../../utils/constantes';
import { hora } from '../../utils/formato';

const OPC_TIPO = [{ valor: '', texto: 'Todos los tipos' }, ...TIPOS_VEHICULO];
const OPC_ESTADO = [{ valor: '', texto: 'Todos los estados' }, { valor: 'LIBRE', texto: 'Libre' }, { valor: 'OCUPADO', texto: 'Ocupado' }, { valor: 'INHABILITADO', texto: 'Inhabilitado' }];
const OPC_ZONA = [{ valor: '', texto: 'Todas las zonas' }, { valor: 'A', texto: 'Sección A' }, { valor: 'B', texto: 'Sección B' }];

function FormularioEspacio({ espacio, alCerrar, alGuardar }) {
  const editando = Boolean(espacio?.id);
  const [form, setForm] = useState({ codigo: espacio?.codigo || '', tipo: espacio?.tipo || 'AUTO', ordenCercania: espacio?.orden_cercania || '' });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    const err = {};
    if (!editando && !/^[A-Za-z]\d{1,3}$/.test(form.codigo.trim())) err.codigo = 'Use una letra de zona y un número, por ejemplo A21';
    if (form.ordenCercania && (form.ordenCercania < 1 || form.ordenCercania > 999)) err.ordenCercania = 'Entre 1 y 999';
    setErrores(err);
    if (Object.keys(err).length) return;

    setGuardando(true);
    try {
      const cuerpo = { tipo: form.tipo, ...(form.ordenCercania ? { ordenCercania: Number(form.ordenCercania) } : {}) };
      const r = editando ? await espaciosApi.actualizar(espacio.id, cuerpo) : await espaciosApi.crear({ ...cuerpo, codigo: form.codigo.trim() });
      toast.success(r.mensaje);
      alGuardar();
    } catch (ex) {
      setErrores(erroresPorCampo(ex));
      toast.error(ex.mensaje);
    } finally { setGuardando(false); }
  }

  return (
    <Modal abierto titulo={editando ? `Editar espacio ${espacio.codigo}` : 'Nuevo espacio'} alCerrar={alCerrar}
      pie={<><Boton variante="secundario" onClick={alCerrar}>Cancelar</Boton><Boton type="submit" form="form-espacio" cargando={guardando}>Guardar</Boton></>}>
      <form id="form-espacio" onSubmit={guardar} className="space-y-4" noValidate>
        <Campo etiqueta="Código" required disabled={editando} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} error={errores.codigo} placeholder="A21" ayuda="La primera letra indica la zona" />
        <Campo como="select" etiqueta="Tipo de espacio" opciones={TIPOS_VEHICULO} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} error={errores.tipo} />
        <Campo type="number" etiqueta="Orden de cercanía a la entrada" value={form.ordenCercania} onChange={(e) => setForm({ ...form, ordenCercania: e.target.value })} error={errores.ordenCercania} ayuda="Menor número = más cerca. Se usa en la asignación automática." />
      </form>
    </Modal>
  );
}

export default function Espacios() {
  const lista = useListado(espaciosApi.listar, { filtrosIniciales: { q: '', zona: '', tipo: '', estado: '' }, ordenInicial: { ordenarPor: 'codigo', direccion: 'asc' } });
  const mapa = useApi(() => espaciosApi.mapa(), []);
  const [vista, setVista] = useState('tabla');
  const [formulario, setFormulario] = useState(null);
  const [accion, setAccion] = useState(null); // { tipo: 'inhabilitar'|'habilitar'|'eliminar', espacio }
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);

  const recargarTodo = () => { lista.recargar({ silencioso: true }); mapa.recargar({ silencioso: true }); };
  useTiempoReal(recargarTodo);

  async function ejecutarAccion() {
    const { tipo, espacio } = accion;
    if (tipo === 'inhabilitar' && motivo.trim().length < 5) { toast.error('Indique el motivo (mínimo 5 caracteres)'); return; }
    setProcesando(true);
    try {
      const r = tipo === 'eliminar'
        ? await espaciosApi.eliminar(espacio.id)
        : await espaciosApi.cambiarEstado(espacio.id, tipo === 'inhabilitar' ? { estado: 'INHABILITADO', motivo: motivo.trim() } : { estado: 'LIBRE' });
      toast.success(r.mensaje);
      setAccion(null); setMotivo('');
      recargarTodo();
    } catch (e) {
      toast.error(e.mensaje);
    } finally { setProcesando(false); }
  }

  const columnas = [
    { clave: 'codigo', titulo: 'Código', ordenable: true, render: (e) => <span className="font-bold">{e.codigo}</span> },
    { clave: 'zona', titulo: 'Zona', ordenable: true, render: (e) => `Sección ${e.zona}` },
    { clave: 'tipo', titulo: 'Tipo', ordenable: true, render: (e) => textoTipo(e.tipo) },
    { clave: 'estado', titulo: 'Estado', ordenable: true, render: (e) => <Insignia punto color={ESTADOS_ESPACIO[e.estado].color}>{ESTADOS_ESPACIO[e.estado].texto}</Insignia> },
    { clave: 'placa', titulo: 'Placa actual', render: (e) => (e.placa ? <span><span className="placa">{e.placa}</span> <span className="text-xs text-slate-400">desde {hora(e.fecha_entrada)}</span></span> : e.motivo_inhabilitado ? <span className="text-xs text-slate-500">{e.motivo_inhabilitado}</span> : '—') },
    {
      clave: 'acciones', titulo: 'Acciones', render: (e) => (
        <div className="flex gap-1">
          <button type="button" className="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="Editar" aria-label={`Editar ${e.codigo}`} onClick={() => setFormulario(e)}><Pencil className="h-4 w-4" /></button>
          {e.estado === 'INHABILITADO'
            ? <button type="button" className="rounded p-1.5 text-libre-oscuro hover:bg-libre-claro" title="Habilitar" aria-label={`Habilitar ${e.codigo}`} onClick={() => setAccion({ tipo: 'habilitar', espacio: e })}><CheckCircle2 className="h-4 w-4" /></button>
            : <button type="button" className="rounded p-1.5 text-alerta-oscuro hover:bg-alerta-claro disabled:opacity-30" title="Inhabilitar" aria-label={`Inhabilitar ${e.codigo}`} disabled={e.estado === 'OCUPADO'} onClick={() => setAccion({ tipo: 'inhabilitar', espacio: e })}><Ban className="h-4 w-4" /></button>}
          <button type="button" className="rounded p-1.5 text-ocupado hover:bg-ocupado-claro" title="Eliminar" aria-label={`Eliminar ${e.codigo}`} onClick={() => setAccion({ tipo: 'eliminar', espacio: e })}><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const resumen = mapa.datos?.resumen;

  return (
    <div>
      <EncabezadoPagina titulo="Gestión de espacios" descripcion="Administre los espacios, su tipo y disponibilidad"
        acciones={(
          <>
            <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
              <button type="button" onClick={() => setVista('tabla')} className={`rounded-md px-3 py-1.5 text-sm ${vista === 'tabla' ? 'bg-marino text-white' : 'text-slate-600'}`} aria-pressed={vista === 'tabla'}><List className="h-4 w-4" /></button>
              <button type="button" onClick={() => setVista('mapa')} className={`rounded-md px-3 py-1.5 text-sm ${vista === 'mapa' ? 'bg-marino text-white' : 'text-slate-600'}`} aria-pressed={vista === 'mapa'}><LayoutGrid className="h-4 w-4" /></button>
            </div>
            <Boton icono={Plus} onClick={() => setFormulario({})}>Nuevo espacio</Boton>
          </>
        )} />

      {resumen && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Insignia color="marino">{resumen.total} espacios</Insignia>
          <Insignia color="verde" punto>{resumen.libres} libres</Insignia>
          <Insignia color="rojo" punto>{resumen.ocupados} ocupados</Insignia>
          <Insignia color="gris" punto>{resumen.inhabilitados} inhabilitados</Insignia>
        </div>
      )}

      {vista === 'mapa' ? (
        <div className="tarjeta p-5">
          <div className="mb-4 flex justify-between"><p className="text-sm text-slate-500">Haga clic en un espacio para editarlo</p><LeyendaMapa /></div>
          {mapa.datos ? <MapaEspacios espacios={mapa.datos.espacios} alSeleccionar={setFormulario} /> : <Cargando />}
        </div>
      ) : (
        <div className="tarjeta">
          <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-4">
            <Campo placeholder="Buscar código o placa..." value={lista.filtros.q} onChange={(e) => lista.cambiarFiltro('q', e.target.value)} aria-label="Buscar" />
            <Campo como="select" opciones={OPC_ZONA} value={lista.filtros.zona} onChange={(e) => lista.cambiarFiltro('zona', e.target.value)} aria-label="Zona" />
            <Campo como="select" opciones={OPC_TIPO} value={lista.filtros.tipo} onChange={(e) => lista.cambiarFiltro('tipo', e.target.value)} aria-label="Tipo" />
            <Campo como="select" opciones={OPC_ESTADO} value={lista.filtros.estado} onChange={(e) => lista.cambiarFiltro('estado', e.target.value)} aria-label="Estado" />
          </div>
          {lista.cargando ? <Cargando /> : lista.error ? <ErrorCarga error={lista.error} alReintentar={lista.recargar} />
            : lista.filas.length === 0 ? <EstadoVacio texto="No hay espacios que coincidan con los filtros" accion={<Boton variante="secundario" tamano="sm" onClick={lista.limpiarFiltros}>Limpiar filtros</Boton>} />
              : <Tabla columnas={columnas} filas={lista.filas} orden={lista.orden} alOrdenar={lista.ordenarPor} />}
          <Paginacion paginacion={lista.paginacion} alCambiar={lista.setPagina} />
        </div>
      )}

      {formulario && <FormularioEspacio espacio={formulario} alCerrar={() => setFormulario(null)} alGuardar={() => { setFormulario(null); recargarTodo(); }} />}

      <Confirmar
        abierto={Boolean(accion)}
        titulo={accion?.tipo === 'eliminar' ? 'Eliminar espacio' : accion?.tipo === 'inhabilitar' ? 'Inhabilitar espacio' : 'Habilitar espacio'}
        mensaje={accion && (accion.tipo === 'eliminar'
          ? `¿Seguro que desea eliminar el espacio ${accion.espacio.codigo}? Esta acción no se puede deshacer.`
          : accion.tipo === 'inhabilitar'
            ? `¿Seguro que desea inhabilitar el espacio ${accion.espacio.codigo}? No se podrán asignar vehículos a este espacio.`
            : `¿Habilitar nuevamente el espacio ${accion.espacio.codigo}?`)}
        textoConfirmar={accion?.tipo === 'habilitar' ? 'Habilitar' : accion?.tipo === 'eliminar' ? 'Eliminar' : 'Inhabilitar'}
        peligro={accion?.tipo !== 'habilitar'}
        cargando={procesando}
        alConfirmar={ejecutarAccion}
        alCancelar={() => { setAccion(null); setMotivo(''); }}
      >
        {accion?.tipo === 'inhabilitar' && (
          <Campo className="mt-3" etiqueta="Motivo" required value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: mantenimiento de señalización" />
        )}
      </Confirmar>
    </div>
  );
}
