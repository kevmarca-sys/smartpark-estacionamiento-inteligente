import { dinero, duracion } from '../../utils/formato';

/** Muestra cómo el backend calculó el valor a pagar (transparencia para el cliente). */
export default function DesgloseCobro({ calculo }) {
  if (!calculo) return null;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-slate-600"><span>Tiempo</span><span className="font-semibold text-tinta">{duracion(calculo.minutos)}</span></div>
      {calculo.enGracia ? (
        <p className="rounded-lg bg-libre-claro px-3 py-2 text-green-800">{calculo.mensaje}</p>
      ) : (
        <>
          <div className="flex justify-between text-slate-600">
            <span>Tarifa base ({calculo.fracciones} fracciones × {dinero(calculo.valorFraccion)})</span>
            <span className="font-semibold text-tinta">{dinero(calculo.subtotal)}</span>
          </div>
          {calculo.topeAplicado && <p className="text-xs text-alerta-oscuro">Se aplicó el tope diario</p>}
          {calculo.ajustes?.map((a) => (
            <div key={a.codigo} className="flex justify-between">
              <span className="text-slate-600">{a.nombre} <span className="text-xs text-slate-400">({a.porcentaje > 0 ? '+' : ''}{a.porcentaje}% · {a.motivo})</span></span>
              <span className={`font-semibold ${a.monto < 0 ? 'text-libre-oscuro' : 'text-alerta-oscuro'}`}>{a.monto < 0 ? '−' : '+'}{dinero(Math.abs(a.monto))}</span>
            </div>
          ))}
        </>
      )}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-marino-claro/60 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-wide text-marino">Total a cobrar</span>
        <span className="text-3xl font-extrabold text-marino">{dinero(calculo.total)}</span>
      </div>
    </div>
  );
}
