import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import Boton from './Boton';

export function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-electrico" />
      <span className="text-sm">{texto}</span>
    </div>
  );
}

export function EstadoVacio({ titulo = 'Sin resultados', texto = 'No se encontraron registros con estos filtros', accion }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="rounded-full bg-slate-100 p-4"><Inbox className="h-8 w-8 text-slate-400" /></div>
      <p className="font-semibold text-slate-700">{titulo}</p>
      <p className="max-w-sm text-sm text-slate-500">{texto}</p>
      {accion}
    </div>
  );
}

export function ErrorCarga({ error, alReintentar }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center" role="alert">
      <div className="rounded-full bg-ocupado-claro p-4"><AlertCircle className="h-8 w-8 text-ocupado" /></div>
      <p className="font-semibold text-slate-700">No se pudo cargar la información</p>
      <p className="max-w-sm text-sm text-slate-500">{error?.mensaje || 'Intente nuevamente'}</p>
      {alReintentar && <Boton variante="secundario" icono={RefreshCw} onClick={() => alReintentar()}>Reintentar</Boton>}
    </div>
  );
}

export function Alerta({ tipo = 'error', titulo, children }) {
  const estilos = {
    error: 'border-ocupado/30 bg-ocupado-claro text-red-800',
    exito: 'border-libre/30 bg-libre-claro text-green-800',
    advertencia: 'border-alerta/40 bg-alerta-claro text-amber-900',
    info: 'border-electrico/30 bg-blue-50 text-blue-900',
  };
  return (
    <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${estilos[tipo]}`}>
      {titulo && <p className="font-bold">{titulo}</p>}
      <div>{children}</div>
    </div>
  );
}
