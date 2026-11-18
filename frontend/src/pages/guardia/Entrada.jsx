import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Accessibility, Bike, Car, CheckCircle2, Mail, Plus, Printer, Star, UserPlus, Wand2 } from 'lucide-react';
import { espaciosApi, lprApi, sesionesApi, vehiculosApi } from '../../api/servicios';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import CamaraPlaca from '../../components/parqueadero/CamaraPlaca';
import TicketQR from '../../components/parqueadero/TicketQR';
import FormularioCliente from '../../components/parqueadero/FormularioCliente';
import { Alerta, Boton, Campo, Insignia } from '../../components/ui';
import { esPlacaValida, normalizarPlaca, textoTipo } from '../../utils/constantes';
import { dinero } from '../../utils/formato';

const TIPOS = [
  { valor: 'AUTO', texto: 'Auto', icono: Car },
  { valor: 'MOTO', texto: 'Moto', icono: Bike },
  { valor: 'DISCAPACIDAD', texto: 'Accesible', icono: Accessibility },
];
const PERMITIDOS = { AUTO: ['AUTO'], MOTO: ['MOTO'], DISCAPACIDAD: ['DISCAPACIDAD', 'AUTO'] };

export default function Entrada() {
  const lpr = useApi(() => lprApi.estado(), []);
  const [placa, setPlaca] = useState('');
  const [lectura, setLectura] = useState(null);
  const [tipo, setTipo] = useState('AUTO');
  const [modoEspacio, setModoEspacio] = useState('auto');
  const [espacioManual, setEspacioManual] = useState('');
  const [error, setError] = useState(null);
  const [registrando, setRegistrando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [registrarCliente, setRegistrarCliente] = useState(false);

  const placaNormal = normalizarPlaca(placa);
  const placaValida = esPlacaValida(placaNormal);
  const placaDebounce = useDebounce(placaValida ? placaNormal : '', 300);

  // Reconoce al vehículo por su placa: si ya vino antes, se llenan sus datos solos
  const vehiculo = useApi(() => (placaDebounce ? vehiculosApi.detalle(placaDebounce) : Promise.resolve(null)), [placaDebounce]);
  const conocido = vehiculo.datos?.datos;
  const esNuevo = placaDebounce && !vehiculo.cargando && vehiculo.error?.status === 404;
  useEffect(() => { if (conocido) setTipo(conocido.tipo); }, [conocido]);

  const mapa = useApi(() => (modoEspacio === 'manual' ? espaciosApi.mapa() : Promise.resolve(null)), [modoEspacio]);
  const libres = useMemo(() => (mapa.datos?.espacios || []).filter((e) => e.estado === 'LIBRE' && PERMITIDOS[tipo].includes(e.tipo)), [mapa.datos, tipo]);

  function alLeerPlaca(l) {
    setLectura(l);
    setPlaca(l.placa);
    if (!conocido && l.tipoSugerido) setTipo(l.tipoSugerido);
    setError(null);
    if (!l.confiable) toast('Lectura poco confiable: verifique la placa', { icon: '⚠️' });
  }

  async function registrar() {
    setError(null);
    if (!placaValida) { setError({ mensaje: 'Placa no válida. Formato auto: ABC-1234 · moto: AB123C' }); return; }
    if (modoEspacio === 'manual' && !espacioManual) { setError({ mensaje: 'Seleccione el espacio' }); return; }
    setRegistrando(true);
    try {
      const r = await sesionesApi.entrada({
        placa: placaNormal,
        tipo,
        ...(modoEspacio === 'manual' ? { espacioCodigo: espacioManual } : {}),
        metodoRegistro: lectura && lectura.placa === placaNormal ? 'LPR' : 'MANUAL',
        ...(lectura && lectura.placa === placaNormal ? { confianza: lectura.confianza } : {}),
      });
      setResultado(r.datos);
      toast.success(r.mensaje);
    } catch (e) {
      setError(e);
    } finally { setRegistrando(false); }
  }

  function nuevaEntrada() {
    setResultado(null); setPlaca(''); setLectura(null); setError(null); setEspacioManual(''); setModoEspacio('auto'); setTipo('AUTO');
  }

  if (resultado) {
    const s = resultado.sesion;
    return (
      <div className="space-y-4">
        <div className="tarjeta p-5 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-libre" />
          <p className="mt-2 text-xl font-bold">Entrada registrada</p>
          <p className="text-sm text-slate-500">Asignación {resultado.asignacion === 'AUTOMATICA' ? 'automática' : 'manual'}{resultado.vehiculoNuevo ? ' · vehículo nuevo' : ` · visita n.º ${resultado.visitas + 1}`}</p>
          <div className="mx-auto mt-4 w-fit rounded-2xl bg-marino px-10 py-4 text-white">
            <p className="text-xs uppercase tracking-widest text-blue-200">Espacio asignado</p>
            <p className="text-6xl font-extrabold">{s.espacio}</p>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {resultado.clienteFrecuente && <Insignia color="ambar"><Star className="h-3 w-3" />Cliente frecuente</Insignia>}
            {s.cliente && <Insignia color="marino">{s.cliente}</Insignia>}
            <Insignia color={resultado.tarifaVigente.porcentaje > 0 ? 'ambar' : 'gris'}>Tarifa {dinero(resultado.tarifaVigente.valorHora)}/h</Insignia>
          </div>
          {resultado.correo.enviado && <p className="mt-3 flex items-center justify-center gap-1 text-sm text-libre-oscuro"><Mail className="h-4 w-4" /> Ticket enviado a {resultado.correo.destino}</p>}
        </div>
        <div id="ticket-imprimible"><TicketQR sesion={s} qr={resultado.qr} tarifaHora={resultado.tarifaVigente.valorHora} /></div>
        <div className="grid grid-cols-2 gap-2">
          <Boton variante="secundario" icono={Printer} onClick={() => window.print()}>Imprimir ticket</Boton>
          <Boton icono={Plus} onClick={nuevaEntrada}>Nueva entrada</Boton>
        </div>
        {!s.cliente && <Boton variante="fantasma" className="w-full" icono={UserPlus} onClick={() => setRegistrarCliente(true)}>Registrar datos del cliente (opcional)</Boton>}
        {registrarCliente && <FormularioCliente placaInicial={s.placa} tipoInicial={s.tipo_vehiculo} alCerrar={() => setRegistrarCliente(false)} alGuardar={() => setRegistrarCliente(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Registrar entrada</h1>

      {lpr.datos?.datos.configurado
        ? <CamaraPlaca alLeer={alLeerPlaca} alError={(m) => toast.error(m)} />
        : lpr.datos && <Alerta tipo="info" titulo="Lectura de placas no configurada">Escriba la placa manualmente. Para activar la cámara configure PLATE_RECOGNIZER_TOKEN en el backend.</Alerta>}

      <div className="tarjeta space-y-4 p-4">
        <div>
          <Campo etiqueta="Placa del vehículo" value={placa} placeholder="ABA-1234" autoCapitalize="characters" autoComplete="off"
            onChange={(e) => { setPlaca(e.target.value.toUpperCase()); setError(null); }}
            onBlur={() => setPlaca(placaNormal)}
            error={placa.length >= 6 && !placaValida ? 'Formato: auto ABC-1234 · moto AB123C' : undefined}
            className="[&_input]:py-3 [&_input]:text-center [&_input]:font-mono [&_input]:text-2xl [&_input]:font-bold [&_input]:tracking-widest" />
          {lectura && lectura.placa === placaNormal && (
            <p className="mt-1 text-center text-xs text-slate-500">Leída por cámara · confianza <b className={lectura.confiable ? 'text-libre-oscuro' : 'text-alerta-oscuro'}>{lectura.confianza}%</b></p>
          )}
        </div>

        {conocido && (
          <div className="flex items-center gap-3 rounded-xl bg-marino-claro/50 p-3">
            <Car className="h-8 w-8 text-marino" />
            <div className="flex-1 text-sm">
              <p className="font-bold">{conocido.cliente || 'Vehículo conocido (ocasional)'}</p>
              <p className="text-slate-600">{textoTipo(conocido.tipo)} · {conocido.estadisticas.visitas} visitas</p>
            </div>
            {conocido.frecuente && <Insignia color="ambar"><Star className="h-3 w-3" />Frecuente</Insignia>}
          </div>
        )}
        {conocido?.sesionAbierta && <Alerta tipo="advertencia">Este vehículo ya está dentro (ticket {conocido.sesionAbierta}).</Alerta>}
        {esNuevo && <Insignia color="azul">Vehículo nuevo: se registrará automáticamente solo con la placa</Insignia>}

        <div>
          <p className="etiqueta">Tipo de vehículo</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {TIPOS.map(({ valor, texto, icono: Icono }) => (
              <button key={valor} type="button" role="radio" aria-checked={tipo === valor} disabled={Boolean(conocido)} onClick={() => setTipo(valor)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${tipo === valor ? 'border-electrico bg-blue-50 text-marino' : 'border-slate-200 text-slate-500'}`}>
                <Icono className="h-5 w-5" />{texto}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="etiqueta">Espacio</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setModoEspacio('auto')} className={`flex items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold ${modoEspacio === 'auto' ? 'border-electrico bg-blue-50 text-marino' : 'border-slate-200 text-slate-500'}`}><Wand2 className="h-4 w-4" />Automático</button>
            <button type="button" onClick={() => setModoEspacio('manual')} className={`rounded-xl border-2 py-2.5 text-sm font-semibold ${modoEspacio === 'manual' ? 'border-electrico bg-blue-50 text-marino' : 'border-slate-200 text-slate-500'}`}>Elegir espacio</button>
          </div>
          {modoEspacio === 'auto' && <p className="mt-2 text-xs text-slate-500">El sistema asignará el espacio libre compatible más cercano a la entrada.</p>}
          {modoEspacio === 'manual' && (
            <Campo className="mt-2" como="select" value={espacioManual} onChange={(e) => setEspacioManual(e.target.value)} aria-label="Espacio"
              opciones={[{ valor: '', texto: mapa.cargando ? 'Cargando...' : `Seleccione (${libres.length} libres)` }, ...libres.map((e) => ({ valor: e.codigo, texto: `${e.codigo} · ${textoTipo(e.tipo)}` }))]} />
          )}
        </div>

        {error && <Alerta titulo={error.codigo === 'VEHICULO_CON_SESION_ABIERTA' ? 'Sesión duplicada' : 'No se pudo registrar'}>{error.mensaje}</Alerta>}

        <Boton tamano="lg" className="w-full" cargando={registrando} disabled={!placaValida} onClick={registrar}>Confirmar entrada</Boton>
      </div>
    </div>
  );
}
