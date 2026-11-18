import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function AccesoDenegado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-lienzo p-6">
      <div className="tarjeta max-w-md p-8 text-center">
        <span className="rounded-full bg-ocupado-claro px-3 py-1 text-xs font-bold text-red-800">ERROR 403 · SEGURIDAD</span>
        <div className="mx-auto my-5 flex h-20 w-20 items-center justify-center rounded-full bg-marino-claro"><Lock className="h-9 w-9 text-marino" /></div>
        <h1 className="text-4xl font-extrabold text-marino">403</h1>
        <h2 className="text-xl font-bold">Acceso denegado</h2>
        <p className="mt-2 text-sm text-slate-500">No tiene permisos para acceder a esta sección. Si cree que es un error, contacte al administrador del sistema.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-marino px-5 py-2.5 text-sm font-semibold text-white">Volver al inicio</Link>
      </div>
    </div>
  );
}
