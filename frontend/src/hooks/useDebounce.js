/**
 * Hook useDebounce
 *
 * Retrasa la actualización de un valor hasta que el usuario deja de escribir.
 * Se usa en los buscadores para no consultar la API en cada tecla.
 */

import { useEffect, useState } from 'react';

export default function useDebounce(valor, ms = 400) {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}
