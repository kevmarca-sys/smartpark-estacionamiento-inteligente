/**
 * Página de tarifas (administrador)
 *
 * Tarifas base, reglas de tarifa dinámica y simulador de cobro.
 * El cálculo del simulador lo realiza el backend.
 */

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Accessibility, Bike, Calculator, Car, Save } from 'lucide-react';
import { tarifasApi } from '../../api/servicios';
import { erroresPorCampo } from '../../api/http';
import useApi from '../../hooks/useApi';
import DesgloseCobro from '../../components/parqueadero/DesgloseCobro';
import { Boton, Campo, Cargando, EncabezadoPagina, ErrorCarga } from '../../components/ui';
import { TIPOS_VEHICULO, textoTipo } from '../../utils/constantes';
import { dinero, hoyISO } from '../../utils/formato';

const ICONOS = { AUTO: Car, MOTO: Bike, DISCAPACIDAD: Accessibility };

function TarjetaTarifa({ tarifa, vigente, alGuardar }) {
  const [form, setForm] = useState({});
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  useEffect(() => setForm({
    valorHora: tarifa.valor_hora, fraccionMinutos: tarifa.fraccion_minutos, minutosGracia: tarifa.minutos_gracia, topeDiario: tarifa.tope_diario,
  }), [tarifa]);
  const Icono = ICONOS[tarifa.tipo_vehiculo];
  const cambiar = (c) => (e) => setForm({ ...form, [c]: e.target.value });

  async function guardar() {
    setGuardando(true);
    try {
      const r = await tarifasApi.actualizarTarifa(tarifa.tipo_vehiculo, {
        valorHora: Number(form.valorHora), fraccionMinutos: Number(form.fraccionMinutos), minutosGracia: Number(form.minutosGracia), topeDiario: Number(form.topeDiario),
      });
      setErrores({});
      toast.success(`${r.mensaje}: ${textoTipo(tarifa.tipo_vehiculo)}`);
      alGuardar();
    } catch (e) { setErrores(erroresPorCampo(e)); toast.error(e.mensaje); } finally { setGuardando(false); }
  }

  return (
    <div className="tarjeta p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="rounded-lg bg-marino-claro p-2 text-marino"><Icono className="h-5 w-5" /></span><h3 className="font-bold">{textoTipo(tarifa.tipo_vehiculo)}</h3></div>
        {vigente && <span className="text-right text-xs text-slate-500">Vigente ahora<br /><b className="text-base text-marino">{dinero(vigente.valorHora)}/h</b></span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Campo type="number" step="0.05" min="0" etiqueta="Valor por hora ($)" value={form.valorHora ?? ''} onChange={cambiar('valorHora')} error={errores.valorHora} />
        <Campo type="number" min="5" max="60" etiqueta="Fracción (min)" value={form.fraccionMinutos ?? ''} onChange={cambiar('fraccionMinutos')} error={errores.fraccionMinutos} />
        <Campo type="number" min="0" max="60" etiqueta="Gracia (min)" value={form.minutosGracia ?? ''} onChange={cambiar('minutosGracia')} error={errores.minutosGracia} />
        <Campo type="number" step="0.5" etiqueta="Tope diario ($)" value={form.topeDiario ?? ''} onChange={cambiar('topeDiario')} error={errores.topeDiario} />
      </div>
      <Boton className="mt-4 w-full" variante="secundario" icono={Save} cargando={guardando} onClick={guardar}>Guardar</Boton>
    </div>
  );
}

const DESCRIPCION_REGLA = {
  ALTA_DEMANDA: 'Recargo cuando la ocupación al ingresar supera el umbral (%)',
  HORA_PICO: 'Recargo si el vehículo ingresa dentro del horario indicado',
  NOCTURNA: 'Descuento si ingresa en horario nocturno (puede cruzar medianoche)',
  CLIENTE_FRECUENTE: 'Descuento desde cierto número de visitas previas',
};

function TarjetaRegla({ regla, alGuardar }) {
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  useEffect(() => setForm({
    activa: regla.activa, porcentaje: regla.porcentaje, umbral: regla.umbral ?? '', horaInicio: regla.hora_inicio?.slice(0, 5) || '', horaFin: regla.hora_fin?.slice(0, 5) || '',
  }), [regla]);
  const conHorario = ['HORA_PICO', 'NOCTURNA'].includes(regla.codigo);

  async function guardar(cambios = {}) {
    const f = { ...form, ...cambios };
    setGuardando(true);
    try {
      await tarifasApi.actualizarRegla(regla.codigo, {
        activa: f.activa, porcentaje: Number(f.porcentaje),
        umbral: conHorario ? null : Number(f.umbral), horaInicio: conHorario ? f.horaInicio : null, horaFin: conHorario ? f.horaFin : null,
      });
      toast.success(`Regla "${regla.nombre}" actualizada`);
      alGuardar();
    } catch (e) { toast.error(e.mensaje); setForm({ ...form }); } finally { setGuardando(false); }
  }

  return (
    <div className={`tarjeta p-5 ${form.activa ? '' : 'opacity-70'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{regla.nombre}</h3>
          <p className="text-xs text-slate-500">{DESCRIPCION_REGLA[regla.codigo]}</p>
        </div>
        <button type="button" role="switch" aria-checked={Boolean(form.activa)} aria-label={`Activar ${regla.nombre}`} disabled={guardando}
          onClick={() => { const activa = !form.activa; setForm({ ...form, activa }); guardar({ activa }); }}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${form.activa ? 'bg-electrico' : 'bg-slate-300'}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${form.activa ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Campo type="number" etiqueta="Porcentaje (%)" value={form.porcentaje ?? ''} onChange={(e) => setForm({ ...form, porcentaje: e.target.value })} ayuda={Number(form.porcentaje) < 0 ? 'Descuento' : 'Recargo'} />
        {conHorario ? (
          <div className="grid grid-cols-2 gap-2">
            <Campo type="time" etiqueta="Desde" value={form.horaInicio || ''} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
            <Campo type="time" etiqueta="Hasta" value={form.horaFin || ''} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} />
          </div>
        ) : (
          <Campo type="number" etiqueta={regla.codigo === 'ALTA_DEMANDA' ? 'Umbral de ocupación (%)' : 'Visitas mínimas'} value={form.umbral ?? ''} onChange={(e) => setForm({ ...form, umbral: e.target.value })} />
        )}
      </div>
      <Boton className="mt-4" tamano="sm" variante="secundario" icono={Save} cargando={guardando} onClick={() => guardar()}>Guardar regla</Boton>
    </div>
  );
}

function Simulador() {
  const [form, setForm] = useState({ tipoVehiculo: 'AUTO', fecha: hoyISO(0), entrada: '17:30', salida: '19:45', ocupacion: 85, visitasPrevias: 12 });
  const [resultado, setResultado] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const cambiar = (c) => (e) => setForm({ ...form, [c]: e.target.value });

  async function simular() {
    setCalculando(true);
    try {
      let salida = new Date(`${form.fecha}T${form.salida}:00-05:00`);
      const entrada = new Date(`${form.fecha}T${form.entrada}:00-05:00`);
      if (salida <= entrada) salida = new Date(salida.getTime() + 86400000);
      const r = await tarifasApi.simular({
        tipoVehiculo: form.tipoVehiculo, fechaEntrada: entrada.toISOString(), fechaSalida: salida.toISOString(),
        ocupacion: Number(form.ocupacion), visitasPrevias: Number(form.visitasPrevias),
      });
      setResultado(r.datos);
    } catch (e) { toast.error(e.mensaje); } finally { setCalculando(false); }
  }

  return (
    <div className="tarjeta p-5">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold"><Calculator className="h-5 w-5 text-marino" /> Simulador de cobro</h2>
      <p className="mb-4 text-xs text-slate-500">Pruebe cómo se calcularía un cobro con la configuración actual (el cálculo lo hace el backend).</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <Campo como="select" etiqueta="Tipo de vehículo" opciones={TIPOS_VEHICULO} value={form.tipoVehiculo} onChange={cambiar('tipoVehiculo')} />
          <Campo type="date" etiqueta="Fecha" value={form.fecha} onChange={cambiar('fecha')} />
          <Campo type="time" etiqueta="Hora de entrada" value={form.entrada} onChange={cambiar('entrada')} />
          <Campo type="time" etiqueta="Hora de salida" value={form.salida} onChange={cambiar('salida')} />
          <Campo type="number" etiqueta="Ocupación al ingresar (%)" value={form.ocupacion} onChange={cambiar('ocupacion')} />
          <Campo type="number" etiqueta="Visitas previas" value={form.visitasPrevias} onChange={cambiar('visitasPrevias')} />
          <Boton className="col-span-2" icono={Calculator} cargando={calculando} onClick={simular}>Calcular</Boton>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          {resultado ? <DesgloseCobro calculo={resultado} /> : <p className="py-10 text-center text-sm text-slate-400">El desglose del cobro aparecerá aquí</p>}
        </div>
      </div>
    </div>
  );
}

export default function Tarifas() {
  const { datos, cargando, error, recargar } = useApi(() => tarifasApi.obtener(), []);
  if (cargando && !datos) return <Cargando />;
  if (error && !datos) return <ErrorCarga error={error} alReintentar={recargar} />;
  const recargarSilencioso = () => recargar({ silencioso: true });

  return (
    <div className="space-y-6">
      <EncabezadoPagina titulo="Configuración de tarifas" descripcion={`Tarifa base por tipo de vehículo y reglas de tarifa dinámica · Ocupación actual: ${Math.round(datos.ocupacion)}%`} />
      <section>
        <h2 className="mb-3 text-lg font-bold">Tarifa base por tipo de vehículo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TIPOS_VEHICULO.map(({ valor }) => {
            const t = datos.tarifas.find((x) => x.tipo_vehiculo === valor);
            return t && <TarjetaTarifa key={valor} tarifa={t} vigente={datos.vigentes.find((v) => v.tipoVehiculo === valor)} alGuardar={recargarSilencioso} />;
          })}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Reglas de tarifa dinámica</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {datos.reglas.map((r) => <TarjetaRegla key={r.codigo} regla={r} alGuardar={recargarSilencioso} />)}
        </div>
      </section>
      <Simulador />
    </div>
  );
}
