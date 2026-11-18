/**
 * Tickets (guardia)
 *
 * Lista los tickets para buscarlos por placa o código y volver a mostrar su QR
 * al cliente, por ejemplo si perdió la foto del ticket. Por defecto muestra los
 * vehículos que están dentro; también permite ver los tickets de hoy.
 */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { sesionesApi } from '../../api/servicios';
import useListado from '../../hooks/useListado';
import useTiempoReal from '../../hooks/useTiempoReal';
import { Campo, Cargando, ErrorCarga, EstadoVacio, Insignia, Paginacion } from '../../components/ui';
import VerTicket from '../../components/parqueadero/VerTicket';
import { ESTADOS_SESION } from '../../utils/constantes';
import { duracion, hora, hoyISO } from '../../utils/formato';

const VISTAS = {
  dentro: { estado: 'ABIERTA', desde: '', hasta: '' },
  hoy: { estado: '', desde: hoyISO(0), hasta: hoyISO(0) },
};

export default function TicketsGuardia() {
  const [vista, setVista] = useState('dentro');
  const [ticket, setTicket] = useState(null);
  const lista = useListado(sesionesApi.listar, {
    filtrosIniciales: { q: '', ...VISTAS.dentro },
    ordenInicial: { ordenarPor: 'fecha_entrada', direccion: 'desc' },
  });
  useTiempoReal(() => lista.recargar({ silencioso: true }));

  function cambiarVista(v) {
    setVista(v);
    Object.entries(VISTAS[v]).forEach(([clave, valor]) => lista.cambiarFiltro(clave, valor));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-tinta">Tickets</h1>
        <p className="text-sm text-slate-500">Busque un ticket para volver a mostrar su código QR</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[['dentro', 'Vehículos dentro'], ['hoy', 'Tickets de hoy']].map(([v, texto]) => (
          <button key={v} type="button" onClick={() => cambiarVista(v)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${vista === v ? 'border-marino bg-marino text-white' : 'border-slate-300 bg-white text-marino'}`}>
            {texto}
          </button>
        ))}
      </div>

      <Campo placeholder="Buscar placa o código de ticket..." value={lista.filtros.q}
        onChange={(e) => lista.cambiarFiltro('q', e.target.value.toUpperCase())} aria-label="Buscar ticket" />

      <div className="tarjeta overflow-hidden">
        {lista.cargando ? <Cargando /> : lista.error ? <ErrorCarga error={lista.error} alReintentar={lista.recargar} />
          : lista.filas.length === 0 ? <EstadoVacio titulo="No hay tickets" texto="Pruebe con otra placa o cambie de vista" />
            : (
              <ul className="divide-y divide-slate-100">
                {lista.filas.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => setTicket(s.codigo_ticket)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-marino-claro text-sm font-bold text-marino">{s.espacio}</span>
                      <span className="min-w-0 flex-1">
                        <span className="placa block">{s.placa}</span>
                        <span className="block text-xs text-slate-500">{s.codigo_ticket} · Entrada {hora(s.fecha_entrada)} · {duracion(s.minutos)}</span>
                      </span>
                      <Insignia color={ESTADOS_SESION[s.estado].color}>{ESTADOS_SESION[s.estado].texto}</Insignia>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
        <Paginacion paginacion={lista.paginacion} alCambiar={lista.setPagina} />
      </div>

      {ticket && <VerTicket codigo={ticket} alCerrar={() => setTicket(null)} />}
    </div>
  );
}
