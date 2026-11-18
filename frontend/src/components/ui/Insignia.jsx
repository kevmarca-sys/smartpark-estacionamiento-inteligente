const COLORES = {
  verde: 'bg-libre-claro text-green-800',
  rojo: 'bg-ocupado-claro text-red-800',
  gris: 'bg-slate-100 text-slate-700',
  azul: 'bg-blue-100 text-blue-800',
  ambar: 'bg-alerta-claro text-amber-800',
  marino: 'bg-marino-claro text-marino',
};

export default function Insignia({ color = 'gris', children, punto = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORES[color]} ${className}`}>
      {punto && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
