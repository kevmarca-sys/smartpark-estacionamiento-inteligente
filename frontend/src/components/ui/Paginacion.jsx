/**
 * Control de paginación para los listados del backend.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Paginacion({ paginacion, alCambiar }) {
  if (!paginacion) return null;
  const { pagina, limite, total, totalPaginas } = paginacion;
  const desde = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const hasta = Math.min(total, pagina * limite);
  const paginas = [];
  for (let i = Math.max(1, pagina - 2); i <= Math.min(totalPaginas, pagina + 2); i += 1) paginas.push(i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600 sm:flex-row">
      <span>Mostrando <b>{desde}–{hasta}</b> de <b>{total}</b></span>
      <nav className="flex items-center gap-1" aria-label="Paginación">
        <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-40" disabled={pagina <= 1} onClick={() => alCambiar(pagina - 1)} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
        {paginas.map((n) => (
          <button key={n} type="button" onClick={() => alCambiar(n)} aria-current={n === pagina ? 'page' : undefined}
            className={`h-8 min-w-8 rounded-lg px-2 font-semibold ${n === pagina ? 'bg-marino text-white' : 'hover:bg-slate-100'}`}>{n}</button>
        ))}
        <button type="button" className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-40" disabled={pagina >= totalPaginas} onClick={() => alCambiar(pagina + 1)} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></button>
      </nav>
    </div>
  );
}
