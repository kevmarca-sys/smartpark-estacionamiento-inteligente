import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, ScanLine, Upload } from 'lucide-react';
import { lprApi } from '../../api/servicios';

/**
 * Cámara para el reconocimiento automático de placas (LPR).
 * Toma una foto del video y la envía al backend, que consulta Plate Recognizer.
 */
export default function CamaraPlaca({ alLeer, alError }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [estadoCamara, setEstadoCamara] = useState('iniciando');
  const [leyendo, setLeyendo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function iniciar() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
        if (cancelado) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setEstadoCamara('lista');
      } catch {
        setEstadoCamara('sin-camara');
      }
    }
    if (navigator.mediaDevices?.getUserMedia) iniciar(); else setEstadoCamara('sin-camara');
    return () => { cancelado = true; streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function enviar(archivo) {
    setLeyendo(true);
    try {
      const r = await lprApi.leer(archivo);
      alLeer(r.datos);
    } catch (e) {
      alError?.(e.mensaje || 'No se pudo leer la placa');
    } finally {
      setLeyendo(false);
    }
  }

  function capturar() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => blob && enviar(blob), 'image/jpeg', 0.9);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white">
      {estadoCamara === 'sin-camara' ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-300">
          <CameraOff className="h-8 w-8" />
          No hay cámara disponible. Puede subir una foto de la placa o escribirla manualmente.
        </div>
      ) : (
        <div className="relative">
          <video ref={videoRef} autoPlay playsInline muted className="h-[240px] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-64 rounded-xl border-4 border-electrico/80 shadow-[0_0_0_2000px_rgba(15,23,42,.35)]" />
          </div>
          <p className="absolute left-0 right-0 top-3 text-center text-xs font-semibold">
            <ScanLine className="mr-1 inline h-4 w-4" />Enfoque la placa del vehículo
          </p>
        </div>
      )}
      {leyendo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/70 text-sm">
          <Loader2 className="h-7 w-7 animate-spin" />Leyendo placa...
        </div>
      )}
      <div className="flex gap-2 p-3">
        <button type="button" onClick={capturar} disabled={estadoCamara !== 'lista' || leyendo}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-electrico py-2.5 text-sm font-bold disabled:opacity-50">
          <Camera className="h-4 w-4" /> Capturar y leer
        </button>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-semibold hover:bg-white/20">
          <Upload className="h-4 w-4" /> Foto
          <input type="file" accept="image/*" capture="environment" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) enviar(f); e.target.value = ''; }} />
        </label>
      </div>
    </div>
  );
}
