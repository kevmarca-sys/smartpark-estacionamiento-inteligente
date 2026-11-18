import { useEffect, useRef, useState } from 'react';
import { CameraOff, Loader2, Radar, ScanLine } from 'lucide-react';
import { lprApi } from '../../api/servicios';

const INTERVALO_MS = 600;         // cada cuánto se revisa la escena
const ESPERA_ENTRE_LECTURAS = 1500; // el plan gratuito permite 1 lectura por segundo
const MAX_REINTENTOS = 3;         // si la placa salió borrosa se reintenta aunque la escena no cambie
const UMBRAL_CAMBIO = 10;         // diferencia promedio (0-255) para considerar que llegó un vehículo
const PAUSA_TRAS_DETECCION = 6000;
const MISMA_PLACA_IGNORAR_MS = 30000;

/** Huella pequeña en escala de grises para comparar fotogramas (detección de movimiento). */
function huella(video, canvas) {
  canvas.width = 64; canvas.height = 48;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, 64, 48);
  const { data } = ctx.getImageData(0, 0, 64, 48);
  const gris = new Uint8Array(64 * 48);
  for (let i = 0; i < gris.length; i += 1) gris[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  return gris;
}

function diferencia(a, b) {
  if (!a || !b) return 255;
  let suma = 0;
  for (let i = 0; i < a.length; i += 1) suma += Math.abs(a[i] - b[i]);
  return suma / a.length;
}

/**
 * Garita automática: la cámara queda encendida, detecta cuando llega un vehículo
 * (cambio en la imagen), lee la placa con el servicio LPR y avisa al componente padre.
 * Solo consulta el servicio cuando la escena cambia, para no gastar lecturas.
 */
export default function GaritaAutomatica({ alDetectar, textoEspera = 'Esperando vehículo...' }) {
  const videoRef = useRef(null);
  const alDetectarRef = useRef(alDetectar);
  alDetectarRef.current = alDetectar;
  const [estado, setEstado] = useState('iniciando');
  const [mensaje, setMensaje] = useState('');
  const [lecturas, setLecturas] = useState(0);

  useEffect(() => {
    let stream = null;
    let temporizador = null;
    let ocupado = false;
    let pausadoHasta = 0;
    let ultimaLlamada = 0;
    let referencia = null;
    let reintentos = 0;            // lecturas fallidas de la escena actual
    const recientes = new Map();
    const lienzo = document.createElement('canvas');
    let cancelado = false;

    async function leer() {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9));
      setLecturas((n) => n + 1);
      return lprApi.leer(blob, 'auto');
    }

    async function ciclo() {
      const video = videoRef.current;
      if (cancelado || ocupado || !video?.videoWidth || Date.now() < pausadoHasta) return;
      const actual = huella(video, lienzo);
      const cambio = diferencia(actual, referencia);
      if (cambio >= UMBRAL_CAMBIO) reintentos = 0;          // llegó algo nuevo
      const reintentar = reintentos > 0 && reintentos < MAX_REINTENTOS;
      if ((cambio < UMBRAL_CAMBIO && !reintentar) || Date.now() - ultimaLlamada < ESPERA_ENTRE_LECTURAS) return;

      ocupado = true;
      ultimaLlamada = Date.now();
      setEstado('leyendo');
      try {
        const r = await leer();
        referencia = actual;
        const l = r.datos;
        const vista = recientes.get(l.placa);
        if (!l.confiable) {
          reintentos += 1;
          setMensaje(`Lectura poco confiable (${l.placa} · ${l.confianza}%). Acerque o enfoque mejor la placa.`);
        } else if (vista && Date.now() - vista < MISMA_PLACA_IGNORAR_MS) {
          setMensaje(`${l.placa} ya fue procesada hace un momento`);
        } else {
          reintentos = 0;
          recientes.set(l.placa, Date.now());
          setEstado('procesando');
          setMensaje(`Placa ${l.placa} detectada (${l.confianza}%)`);
          await alDetectarRef.current?.(l);
          pausadoHasta = Date.now() + PAUSA_TRAS_DETECCION;
        }
      } catch (e) {
        referencia = actual; // no volver a consultar la misma escena
        if (e.status === 503) {
          setEstado('error');
          setMensaje(e.mensaje);
          clearInterval(temporizador);
          return;
        }
        if (e.codigo === 'PLACA_NO_DETECTADA') reintentos += 1;
        setMensaje(e.codigo === 'PLACA_NO_DETECTADA' ? 'No se ve ninguna placa en la imagen' : e.mensaje);
      } finally {
        ocupado = false;
        if (!cancelado) setEstado((s) => (s === 'error' ? s : 'esperando'));
      }
    }

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
        if (cancelado) { stream.getTracks().forEach((t) => t.stop()); return; }
        videoRef.current.srcObject = stream;
        setEstado('esperando');
        temporizador = setInterval(ciclo, INTERVALO_MS);
      } catch {
        setEstado('sin-camara');
      }
    })();

    return () => {
      cancelado = true;
      clearInterval(temporizador);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const etiquetas = {
    iniciando: 'Encendiendo cámara...',
    esperando: textoEspera,
    leyendo: 'Leyendo placa...',
    procesando: 'Procesando vehículo...',
  };

  if (estado === 'sin-camara') {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl bg-slate-900 p-6 text-center text-sm text-slate-300">
        <CameraOff className="h-8 w-8" />No se pudo acceder a la cámara. Revise los permisos del navegador.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900 text-white">
      <div className="relative">
        <video ref={videoRef} autoPlay playsInline muted className="h-[260px] w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`h-24 w-64 rounded-xl border-4 transition ${estado === 'procesando' ? 'border-libre' : 'border-electrico/80'}`} />
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-bold">
          {estado === 'esperando' ? <Radar className="h-4 w-4 animate-pulse text-libre" /> : estado === 'error' ? <CameraOff className="h-4 w-4 text-ocupado" /> : <Loader2 className="h-4 w-4 animate-spin" />}
          {estado === 'error' ? 'Detenido' : etiquetas[estado]}
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-2 py-1 text-[10px]">Lecturas: {lecturas}</span>
      </div>
      <p className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300">
        <ScanLine className="h-4 w-4 shrink-0" />{mensaje || 'Modo automático: la cámara detecta el vehículo y lee la placa sola.'}
      </p>
    </div>
  );
}
