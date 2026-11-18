/**
 * Página 404: la ruta solicitada no existe.
 */

import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';

export default function NoEncontrado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-lienzo p-6">
      <div className="tarjeta max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-marino-claro"><MapPinOff className="h-9 w-9 text-marino" /></div>
        <h1 className="text-4xl font-extrabold text-marino">404</h1>
        <p className="mt-2 text-sm text-slate-500">La página que busca no existe.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-marino px-5 py-2.5 text-sm font-semibold text-white">Volver al inicio</Link>
      </div>
    </div>
  );
}
