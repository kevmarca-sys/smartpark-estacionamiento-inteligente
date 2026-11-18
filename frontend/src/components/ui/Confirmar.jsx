/**
 * Diálogo de confirmación
 *
 * Se muestra antes de las operaciones críticas: cobrar, anular o eliminar.
 */

import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Boton from './Boton';

/** Confirmación antes de operaciones destructivas o de cobro. */
export default function Confirmar({ abierto, titulo, mensaje, textoConfirmar = 'Confirmar', peligro = true, cargando, alConfirmar, alCancelar, children }) {
  return (
    <Modal
      abierto={abierto}
      alCerrar={alCancelar}
      titulo={titulo}
      ancho="max-w-md"
      pie={(
        <>
          <Boton variante="secundario" onClick={alCancelar} disabled={cargando}>Cancelar</Boton>
          <Boton variante={peligro ? 'peligro' : 'primario'} onClick={alConfirmar} cargando={cargando}>{textoConfirmar}</Boton>
        </>
      )}
    >
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${peligro ? 'bg-ocupado-claro text-ocupado' : 'bg-blue-100 text-marino'}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="text-sm text-slate-600">
          <p>{mensaje}</p>
          {children}
        </div>
      </div>
    </Modal>
  );
}
