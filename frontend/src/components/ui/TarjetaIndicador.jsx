/**
 * Tarjeta de indicador (KPI) del panel del administrador.
 */

export default function TarjetaIndicador({ titulo, valor, detalle, icono: Icono, color = 'text-marino bg-marino-claro', barra }) {
  return (
    <div className="tarjeta p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        {Icono && <span className={`rounded-lg p-2 ${color}`}><Icono className="h-4 w-4" /></span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-tinta">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
      {barra !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-electrico transition-all" style={{ width: `${Math.min(100, barra)}%` }} />
        </div>
      )}
    </div>
  );
}
