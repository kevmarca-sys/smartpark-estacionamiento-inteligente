import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraOff } from 'lucide-react';

/**
 * Lector de códigos QR con la cámara del dispositivo (html5-qrcode).
 * Requiere HTTPS o localhost para acceder a la cámara.
 */
export default function EscanerQR({ alLeer, activo = true }) {
  const idContenedor = useRef(`qr-${Math.random().toString(36).slice(2)}`);
  const lectorRef = useRef(null);
  const alLeerRef = useRef(alLeer);
  alLeerRef.current = alLeer;
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activo) return undefined;
    const lector = new Html5Qrcode(idContenedor.current, { verbose: false });
    lectorRef.current = lector;
    let ultimo = '';
    let detenido = false;

    lector.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      (texto) => {
        if (texto === ultimo) return;     // evita lecturas repetidas del mismo código
        ultimo = texto;
        setTimeout(() => { ultimo = ''; }, 3000);
        alLeerRef.current?.(texto);
      },
      () => {},
    ).catch(() => {
      if (!detenido) setError('No se pudo acceder a la cámara. Revise los permisos del navegador o ingrese el código manualmente.');
    });

    return () => {
      detenido = true;
      if (lector.isScanning) lector.stop().then(() => lector.clear()).catch(() => {});
    };
  }, [activo]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900">
      <div id={idContenedor.current} className="min-h-[260px] [&_video]:!w-full [&_video]:object-cover" />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 p-6 text-center text-sm text-slate-200">
          <CameraOff className="h-8 w-8" />
          {error}
        </div>
      )}
    </div>
  );
}
