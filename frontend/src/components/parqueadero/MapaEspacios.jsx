import { Accessibility, Bike, Car, Wrench } from 'lucide-react';

const ICONOS = { AUTO: Car, MOTO: Bike, DISCAPACIDAD: Accessibility };

const ESTILO = {
  LIBRE: 'border-libre/40 bg-libre-claro/60 text-green-800 hover:border-libre',
  OCUPADO: 'border-ocupado/40 bg-ocupado-claro/70 text-red-800 hover:border-ocupado',
  INHABILITADO: 'border-slate-300 bg-slate-100 text-slate-500 hover:border-slate-400',
};

/** Mapa del estacionamiento: cada espacio con su color según el estado. */
export default function MapaEspacios({ espacios = [], alSeleccionar, resaltado }) {
  const zonas = espacios.reduce((acc, e) => { (acc[e.zona] ||= []).push(e); return acc; }, {});

  return (
    <div className="space-y-5">
      {Object.entries(zonas).map(([zona, lista]) => (
        <section key={zona} aria-label={`Sección ${zona}`}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-bold text-tinta">Sección {zona}</h3>
            <span className="rounded-full bg-marino-claro px-2 py-0.5 text-xs font-semibold text-marino">{lista.length} espacios</span>
            <span className="text-xs text-slate-500">{lista.filter((e) => e.estado === 'LIBRE').length} libres</span>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {lista.map((e) => {
              const Icono = e.estado === 'INHABILITADO' ? Wrench : ICONOS[e.tipo] || Car;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => alSeleccionar?.(e)}
                  title={`${e.codigo} · ${e.estado}${e.placa ? ` · ${e.placa}` : ''}`}
                  aria-label={`Espacio ${e.codigo}, ${e.estado.toLowerCase()}${e.placa ? `, placa ${e.placa}` : ''}`}
                  className={`flex min-h-[74px] flex-col items-center justify-center rounded-lg border-2 p-1 text-center transition ${ESTILO[e.estado]} ${resaltado === e.codigo ? 'ring-4 ring-electrico/50 scale-105' : ''}`}
                >
                  <span className="text-xs font-bold">{e.codigo}</span>
                  <Icono className="my-0.5 h-4 w-4" />
                  <span className="text-[10px] font-semibold leading-tight">
                    {e.estado === 'OCUPADO' ? e.placa : e.estado === 'LIBRE' ? 'Libre' : 'Inhab.'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function LeyendaMapa() {
  return (
    <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600">
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-libre" />Libre</span>
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-ocupado" />Ocupado</span>
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-inhabilitado" />Inhabilitado</span>
    </div>
  );
}
