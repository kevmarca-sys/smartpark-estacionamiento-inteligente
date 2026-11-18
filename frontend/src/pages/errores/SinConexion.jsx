import { useNavigate } from 'react-router-dom';
import { CloudOff, RefreshCw } from 'lucide-react';

export default function SinConexion() {
  const navegar = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-lienzo p-6">
      <div className="tarjeta max-w-md p-8 text-center">
        <span className="rounded-full bg-ocupado-claro px-3 py-1 text-xs font-bold text-red-800">ESTADO DE RED · DESCONECTADO</span>
        <div className="mx-auto my-5 flex h-20 w-20 items-center justify-center rounded-full bg-marino-claro"><CloudOff className="h-9 w-9 text-marino" /></div>
        <h1 className="text-xl font-bold">Sin conexión con el servidor</h1>
        <p className="mt-2 text-sm text-slate-500">No pudimos conectar con el servidor. Verifique su conexión a internet e intente nuevamente.</p>
        <button type="button" onClick={() => navegar(-1)} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-marino px-5 py-2.5 text-sm font-semibold text-white">
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      </div>
    </div>
  );
}
