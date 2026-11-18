/**
 * Layout del guardia
 *
 * Interfaz móvil para la garita, con navegación inferior entre Inicio, Entrada y Salida.
 */

import { NavLink, Outlet } from 'react-router-dom';
import { Home, LayoutDashboard, LogIn, LogOut, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import IndicadorEnVivo from '../components/IndicadorEnVivo';

export default function GuardiaLayout() {
  const { usuario, esAdmin, cerrarSesion } = useAuth();
  const enlaces = [
    { a: '/guardia', texto: 'Inicio', icono: Home, fin: true },
    { a: '/guardia/entrada', texto: 'Entrada', icono: LogIn },
    { a: '/guardia/salida', texto: 'Salida', icono: QrCode },
  ];
  return (
    <div className="mx-auto min-h-screen max-w-xl bg-lienzo pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-marino px-4 py-3">
        <Logo subtitulo={`Garita · ${usuario?.nombre || ''}`} />
        <div className="flex items-center gap-2">
          <IndicadorEnVivo />
          {esAdmin && <NavLink to="/admin" className="rounded-lg bg-white/10 p-2 text-white" aria-label="Panel de administración"><LayoutDashboard className="h-5 w-5" /></NavLink>}
        </div>
      </header>
      <main className="p-4"><Outlet /></main>
      <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-xl -translate-x-1/2 border-t border-slate-200 bg-white" aria-label="Navegación del guardia">
        {enlaces.map(({ a, texto, icono: Icono, fin }) => (
          <NavLink key={a} to={a} end={fin}
            className={({ isActive }) => `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold ${isActive ? 'text-electrico' : 'text-slate-500'}`}>
            <Icono className="h-5 w-5" /> {texto}
          </NavLink>
        ))}
        <button type="button" onClick={cerrarSesion} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold text-slate-500">
          <LogOut className="h-5 w-5" /> Salir
        </button>
      </nav>
    </div>
  );
}
