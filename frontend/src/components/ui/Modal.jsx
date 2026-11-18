/**
 * Ventana modal reutilizable con título, contenido y pie de acciones.
 */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ abierto, alCerrar, titulo, subtitulo, children, pie, ancho = 'max-w-lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!abierto) return undefined;
    const tecla = (e) => e.key === 'Escape' && alCerrar?.();
    document.addEventListener('keydown', tecla);
    ref.current?.querySelector('input, select, textarea, button')?.focus();
    return () => document.removeEventListener('keydown', tecla);
  }, [abierto, alCerrar]);

  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && alCerrar?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={titulo} className={`w-full ${ancho} max-h-[92vh] overflow-y-auto rounded-xl2 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-tinta">{titulo}</h2>
            {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
          </div>
          <button type="button" onClick={alCerrar} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {pie && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3 rounded-b-xl2">{pie}</div>}
      </div>
    </div>
  );
}
