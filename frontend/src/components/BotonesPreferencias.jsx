/**
 * Botones de preferencias visuales
 *
 * Alterna entre modo claro y oscuro, y entre español e inglés.
 * La variante "sobreOscuro" se usa sobre fondos azules (cabecera del guardia).
 */

import { Languages, Moon, Sun } from 'lucide-react';
import { usePreferencias } from '../context/PreferenciasContext';

export default function BotonesPreferencias({ sobreOscuro = false }) {
  const { tema, idioma, alternarTema, alternarIdioma } = usePreferencias();
  const estilo = sobreOscuro
    ? 'bg-white/10 text-white hover:bg-white/20'
    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100';
  const oscuro = tema === 'oscuro';

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={alternarTema} className={`rounded-lg p-2 ${estilo}`}
        title={oscuro ? 'Modo claro' : 'Modo oscuro'} aria-label={oscuro ? 'Modo claro' : 'Modo oscuro'}>
        {oscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <button type="button" onClick={alternarIdioma} className={`flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold ${estilo}`}
        title="Cambiar idioma" aria-label="Cambiar idioma" translate="no">
        <Languages className="h-4 w-4" />{idioma === 'es' ? 'ES' : 'EN'}
      </button>
    </div>
  );
}
