import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta una petición y maneja los estados de carga, error y datos.
 * const { datos, cargando, error, recargar } = useApi(() => api.listar(filtros), [filtros]);
 */
export default function useApi(funcion, dependencias = [], { inmediato = true } = {}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(inmediato);
  const [error, setError] = useState(null);
  const ultimaPeticion = useRef(0);

  const ejecutar = useCallback(async ({ silencioso = false } = {}) => {
    const id = ++ultimaPeticion.current;
    if (!silencioso) setCargando(true);
    setError(null);
    try {
      const r = await funcion();
      if (id === ultimaPeticion.current) setDatos(r);
      return r;
    } catch (e) {
      if (id === ultimaPeticion.current) setError(e);
      return null;
    } finally {
      if (id === ultimaPeticion.current) setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useEffect(() => { if (inmediato) ejecutar(); }, [ejecutar, inmediato]);

  return { datos, cargando, error, recargar: ejecutar, setDatos };
}
