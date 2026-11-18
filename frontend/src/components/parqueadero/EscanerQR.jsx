/**
 * Escáner de códigos QR
 *
 * Lee el QR del ticket con la cámara del dispositivo (html5-qrcode). Usa el
 * detector nativo del navegador cuando está disponible para leer más rápido.
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { CameraOff } from 'lucide-react';

/**
 * Lector de códigos QR con la cámara del dispositivo (html5-qrcode).
 * Usa el lector nativo del navegador cuando existe (más rápido).
 * Requiere HTTPS o localhost para acceder a la cámara.
 */
export default function EscanerQR({ alLeer, activo = true }) {
  const idContenedor = useRef(`qr-${Math.random().toString(36).slice(2)}`);
  const alLeerRef = useRef(alLeer);
  alLeerRef.current = alLeer;
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activo) return undefined;
    const lector = new Html5Qrcode(idContenedor.current, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
    });
    let ultimo = '';
    let detenido = false;

    const inicio = lector.start(
      { facingMode: 'environment' },
      {
        fps: 15,
        // Recuadro de lectura grande: 75 % del lado menor del video
        qrbox: (ancho, alto) => {
          const lado = Math.floor(Math.min(ancho, alto) * 0.75);
          return { width: lado, height: lado };
        },
      },
      (texto) => {
        if (texto === ultimo) return; // Evita lecturas repetidas del mismo código
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
      // Espera a que la cámara termine de iniciar antes de apagarla
      inicio.finally(() => {
        if (lector.isScanning) lector.stop().catch(() => {});
      });
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
