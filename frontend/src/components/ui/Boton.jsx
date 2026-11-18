import { Loader2 } from 'lucide-react';

const VARIANTES = {
  primario: 'bg-marino text-white hover:bg-marino-oscuro',
  secundario: 'bg-white text-marino border border-slate-300 hover:bg-slate-50',
  electrico: 'bg-electrico text-white hover:bg-electrico-oscuro',
  peligro: 'bg-ocupado text-white hover:bg-ocupado-oscuro',
  exito: 'bg-libre-oscuro text-white hover:bg-green-700',
  fantasma: 'text-slate-600 hover:bg-slate-100',
};
const TAMANOS = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-3 text-base' };

export default function Boton({ variante = 'primario', tamano = 'md', cargando = false, icono: Icono, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      disabled={cargando || props.disabled}
      {...props}
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : Icono && <Icono className="h-4 w-4" />}
      {children}
    </button>
  );
}
