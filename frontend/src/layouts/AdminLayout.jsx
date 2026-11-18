/**
 * Layout del administrador
 *
 * Menú lateral, buscador global y barra superior con el indicador de tiempo real.
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, Car, CircleDollarSign, History, LayoutDashboard, LogOut, Menu, ParkingSquare, ScanLine, Search, ShieldCheck, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import IndicadorEnVivo from '../components/IndicadorEnVivo';
import BotonesPreferencias from '../components/BotonesPreferencias';

const MENU = [
  { a: '/admin', texto: 'Panel en vivo', icono: LayoutDashboard, fin: true },
  { a: '/admin/espacios', texto: 'Espacios', icono: ParkingSquare },
  { a: '/admin/sesiones', texto: 'Tickets', icono: History },
  { a: '/admin/clientes', texto: 'Clientes y vehículos', icono: Car },
  { a: '/admin/tarifas', texto: 'Tarifas', icono: CircleDollarSign },
  { a: '/admin/reportes', texto: 'Reportes', icono: BarChart3 },
  { a: '/admin/auditoria', texto: 'Auditoría', icono: ShieldCheck },
  { a: '/admin/usuarios', texto: 'Usuarios', icono: Users },
];

export default function AdminLayout() {
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const navegar = useNavigate();

  const buscar = (e) => {
    e.preventDefault();
    if (busqueda.trim()) navegar(`/admin/clientes?q=${encodeURIComponent(busqueda.trim())}`);
  };

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-marino transition-transform lg:translate-x-0 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5">
          <Logo subtitulo="Cuenca · Ecuador" />
          <button type="button" className="text-white lg:hidden" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú"><X /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Menú principal">
          {MENU.map(({ a, texto, icono: Icono, fin }) => (
            <NavLink key={a} to={a} end={fin} onClick={() => setMenuAbierto(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-electrico text-white shadow' : 'text-blue-100 hover:bg-white/10'}`}>
              <Icono className="h-4 w-4" /> {texto}
            </NavLink>
          ))}
          <NavLink to="/guardia" className="mt-4 flex items-center gap-3 rounded-lg border border-white/20 px-3 py-2.5 text-sm font-medium text-blue-100 hover:bg-white/10">
            <ScanLine className="h-4 w-4" /> Vista del guardia
          </NavLink>
        </nav>
        <button type="button" onClick={cerrarSesion} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-blue-100 hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </aside>
      {menuAbierto && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
        <button type="button" className="lg:hidden" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú"><Menu /></button>
        <form onSubmit={buscar} className="relative hidden max-w-md flex-1 md:block" role="search">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por placa, cliente o cédula..." aria-label="Buscar"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-electrico focus:outline-none" />
        </form>
        <div className="ml-auto flex items-center gap-3">
          <IndicadorEnVivo />
          <BotonesPreferencias />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-tinta">{usuario?.nombre}</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marino text-sm font-bold text-white">
            {usuario?.nombre?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </span>
        </div>
      </header>

      <main className="p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
