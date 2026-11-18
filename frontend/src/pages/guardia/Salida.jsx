/**
 * Registro de salida y cobro (guardia)
 *
 * Identifica la sesión por placa (cámara), por QR o de forma manual, muestra el
 * desglose calculado por el backend y registra el pago.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, CheckCircle2, FileText, Keyboard, Landmark, QrCode, Radar, Search } from 'lucide-react';
import { abrirPdf, lprApi, sesionesApi } from '../../api/servicios';
import useApi from '../../hooks/useApi';
import GaritaAutomatica from '../../components/parqueadero/GaritaAutomatica';
import EscanerQR from '../../components/parqueadero/EscanerQR';
import DesgloseCobro from '../../components/parqueadero/DesgloseCobro';
import { Alerta, Boton, Campo, Confirmar } from '../../components/ui';
import { dinero, hora } from '../../utils/formato';

export default function Salida() {
  const [modo, setModo] = useState('camara');
  const [codigoManual, setCodigoManual] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [cobro, setCobro] = useState(null);
  const [error, setError] = useState(null);
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [referencia, setReferencia] = useState('');
  const [errorRef, setErrorRef] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [pagado, setPagado] = useState(null);
  const lpr = useApi(() => lprApi.estado(), []);
  const lprActivo = Boolean(lpr.datos?.datos.configurado);

  async function consultar(texto) {
    if (!texto?.trim() || consultando) return;
    setConsultando(true); setError(null);
    try {
      const r = await sesionesApi.consultarCobro(texto.trim());
      setCobro(r.datos);
      if (navigator.vibrate) navigator.vibrate(80);
    } catch (e) {
      setError(e);
    } finally { setConsultando(false); }
  }

  function pedirConfirmacion() {
    if (metodo === 'TRANSFERENCIA' && referencia.trim().length < 4) { setErrorRef('Ingrese el número de comprobante (mínimo 4 caracteres)'); return; }
    setErrorRef('');
    setConfirmar(true);
  }

  async function cobrar() {
    setCobrando(true);
    try {
      const r = await sesionesApi.salida(cobro.sesion.codigo_ticket, { metodo, ...(metodo === 'TRANSFERENCIA' ? { referencia: referencia.trim() } : {}) });
      setPagado(r.datos);
      setConfirmar(false);
      toast.success(r.mensaje);
    } catch (e) {
      setConfirmar(false);
      setError(e);
      setCobro(null);
    } finally { setCobrando(false); }
  }

  function siguiente() {
    setCobro(null); setPagado(null); setError(null); setCodigoManual(''); setReferencia(''); setMetodo('EFECTIVO');
  }

  if (pagado) {
    const s = pagado.sesion;
    return (
      <div className="space-y-4">
        <div className="tarjeta p-6 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-libre" />
          <p className="mt-2 text-xl font-bold">Pago registrado</p>
          <p className="text-sm text-slate-500">Espacio <b>{s.espacio}</b> liberado · {hora(s.fecha_salida)}</p>
          <p className="mt-4 text-4xl font-extrabold text-marino">{dinero(s.total)}</p>
          <p className="text-sm text-slate-500">{s.metodo === 'EFECTIVO' ? 'Efectivo' : `Transferencia · ${s.referencia}`}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Boton variante="secundario" icono={FileText} onClick={() => abrirPdf(`/sesiones/${s.codigo_ticket}/comprobante`).catch(() => toast.error('No se pudo abrir el PDF'))}>Comprobante PDF</Boton>
          <Boton icono={QrCode} onClick={siguiente}>Siguiente vehículo</Boton>
        </div>
      </div>
    );
  }

  if (cobro) {
    const s = cobro.sesion;
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Cobro y salida</h1>
        <div className="tarjeta p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="placa text-2xl text-marino">{s.placa}</p>
            <span className="rounded-lg bg-marino px-3 py-1 text-lg font-bold text-white">{s.espacio}</span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-slate-50 p-2"><p className="text-xs text-slate-500">Entrada</p><p className="font-bold">{hora(s.fecha_entrada)}</p></div>
            <div className="rounded-lg bg-slate-50 p-2"><p className="text-xs text-slate-500">Salida (ahora)</p><p className="font-bold">{hora(new Date())}</p></div>
          </div>
          <DesgloseCobro calculo={cobro.calculo} />
        </div>

        <div className="tarjeta space-y-3 p-4">
          <p className="etiqueta">Método de pago</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {[['EFECTIVO', 'Efectivo', Banknote], ['TRANSFERENCIA', 'Transferencia', Landmark]].map(([v, t, Icono]) => (
              <button key={v} type="button" role="radio" aria-checked={metodo === v} onClick={() => setMetodo(v)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold ${metodo === v ? 'border-electrico bg-blue-50 text-marino' : 'border-slate-200 text-slate-500'}`}>
                <Icono className="h-5 w-5" />{t}
              </button>
            ))}
          </div>
          {metodo === 'TRANSFERENCIA' && <Campo etiqueta="N.º de comprobante" value={referencia} onChange={(e) => setReferencia(e.target.value)} error={errorRef} placeholder="Ej: 004512889" />}
          <Boton tamano="lg" variante="exito" className="w-full" onClick={pedirConfirmacion}>Confirmar pago y liberar espacio</Boton>
          <Boton variante="fantasma" className="w-full" onClick={siguiente}>Cancelar</Boton>
        </div>

        <Confirmar abierto={confirmar} peligro={false} titulo="Confirmar cobro" textoConfirmar={`Cobrar ${dinero(cobro.calculo.total)}`} cargando={cobrando}
          mensaje={`¿Confirmar el cobro de ${dinero(cobro.calculo.total)} (${metodo === 'EFECTIVO' ? 'efectivo' : 'transferencia'}) a la placa ${s.placa}? El espacio ${s.espacio} quedará libre.`}
          alConfirmar={cobrar} alCancelar={() => setConfirmar(false)}>
          <p className="mt-2 text-xs text-slate-500">El valor final lo recalcula el servidor al confirmar.</p>
        </Confirmar>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Registrar salida</h1>
      <div className={`grid gap-2 ${lprActivo ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {lprActivo && <Boton variante={modo === 'placa' ? 'primario' : 'secundario'} icono={Radar} onClick={() => setModo('placa')}>Placa</Boton>}
        <Boton variante={modo === 'camara' ? 'primario' : 'secundario'} icono={QrCode} onClick={() => setModo('camara')}>QR</Boton>
        <Boton variante={modo === 'manual' ? 'primario' : 'secundario'} icono={Keyboard} onClick={() => setModo('manual')}>Manual</Boton>
      </div>

      {error && (
        <Alerta titulo={error.codigo === 'TICKET_CERRADO' ? 'Atención: ticket no válido o ya usado' : 'No se pudo procesar'}>
          {error.mensaje}
        </Alerta>
      )}

      {modo === 'placa' ? (
        <>
          <GaritaAutomatica alDetectar={(l) => consultar(l.placa)} textoEspera="Esperando vehículo en la salida..." />
          <p className="text-center text-sm text-slate-500">La cámara lee la placa y busca su ticket automáticamente (sin QR).</p>
        </>
      ) : modo === 'camara' ? (
        <>
          <EscanerQR alLeer={consultar} />
          <p className="text-center text-sm text-slate-500">{consultando ? 'Consultando ticket...' : 'Apunte la cámara al código QR del ticket'}</p>
        </>
      ) : (
        <form className="tarjeta space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); consultar(codigoManual); }}>
          <Campo etiqueta="Código del ticket o placa" value={codigoManual} onChange={(e) => setCodigoManual(e.target.value.toUpperCase())} placeholder="TK-XXXXXXXX o ABC-1234" />
          <Boton type="submit" className="w-full" icono={Search} cargando={consultando}>Buscar ticket</Boton>
        </form>
      )}
    </div>
  );
}
