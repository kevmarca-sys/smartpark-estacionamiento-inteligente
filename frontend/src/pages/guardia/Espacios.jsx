/**
 * Disponibilidad de espacios (guardia)
 *
 * Vista de solo lectura: el guardia consulta qué espacios están libres, ocupados
 * o inhabilitados, sin poder modificarlos. Se actualiza en tiempo real.
 */

import { Accessibility, Bike, Car } from 'lucide-react';
import { espaciosApi } from '../../api/servicios';
import useApi from '../../hooks/useApi';
import useTiempoReal from '../../hooks/useTiempoReal';
import { Cargando, ErrorCarga } from '../../components/ui';
import MapaEspacios, { LeyendaMapa } from '../../components/parqueadero/MapaEspacios';

const TIPOS = [
  { tipo: 'AUTO', texto: 'Autos', icono: Car },
  { tipo: 'MOTO', texto: 'Motos', icono: Bike },
  { tipo: 'DISCAPACIDAD', texto: 'Discapacidad', icono: Accessibility },
];

export default function EspaciosGuardia() {
  const mapa = useApi(() => espaciosApi.mapa(), []);
  useTiempoReal(() => mapa.recargar({ silencioso: true }));

  if (mapa.cargando && !mapa.datos) return <Cargando />;
  if (mapa.error && !mapa.datos) return <ErrorCarga error={mapa.error} alReintentar={() => mapa.recargar()} />;

  const { espacios = [], resumen } = mapa.datos || {};
  const libresPorTipo = (tipo) => espacios.filter((e) => e.tipo === tipo && e.estado === 'LIBRE').length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-tinta">Espacios disponibles</h1>
        <p className="text-sm text-slate-500">Consulta en tiempo real · solo lectura</p>
      </div>

      <div className="tarjeta p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">Libres ahora</p>
            <p className="text-3xl font-bold text-libre-oscuro">{resumen?.libres ?? 0}<span className="text-lg text-slate-400"> / {(resumen?.total ?? 0) - (resumen?.inhabilitados ?? 0)}</span></p>
          </div>
          <p className="text-sm font-semibold text-slate-600">Ocupación {Math.round(resumen?.ocupacion ?? 0)}%</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {TIPOS.map(({ tipo, texto, icono: Icono }) => (
            <div key={tipo} className="rounded-lg bg-slate-50 p-2 text-center">
              <Icono className="mx-auto h-5 w-5 text-marino" />
              <p className="mt-1 text-lg font-bold">{libresPorTipo(tipo)}</p>
              <p className="text-xs text-slate-500">{texto} libres</p>
            </div>
          ))}
        </div>
      </div>

      <div className="tarjeta space-y-3 p-4">
        <LeyendaMapa />
        <MapaEspacios espacios={espacios} />
      </div>
    </div>
  );
}
