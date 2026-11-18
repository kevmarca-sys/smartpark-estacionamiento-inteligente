/**
 * Hook useListado
 *
 * Gestiona un listado paginado del backend: filtros, búsqueda, orden, página y recarga.
 */

import { useCallback, useMemo, useState } from 'react';
import useApi from './useApi';
import useDebounce from './useDebounce';

/**
 * Maneja búsqueda, filtros combinados, ordenamiento y paginación REAL (desde el backend).
 */
export default function useListado(funcionApi, { filtrosIniciales = {}, ordenInicial = {}, limite = 10 } = {}) {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState(ordenInicial);
  const filtrosDebounce = useDebounce(filtros, 350);

  const params = useMemo(() => {
    const limpios = Object.fromEntries(Object.entries(filtrosDebounce).filter(([, v]) => v !== '' && v !== null && v !== undefined));
    return { ...limpios, ...orden, pagina, limite };
  }, [filtrosDebounce, orden, pagina, limite]);

  const consulta = useApi(() => funcionApi(params), [JSON.stringify(params)]);

  const cambiarFiltro = useCallback((clave, valor) => {
    setFiltros((f) => ({ ...f, [clave]: valor }));
    setPagina(1);
  }, []);

  const limpiarFiltros = useCallback(() => { setFiltros(filtrosIniciales); setPagina(1); }, [filtrosIniciales]);

  const ordenarPor = useCallback((clave) => {
    setOrden((o) => ({ ordenarPor: clave, direccion: o.ordenarPor === clave && o.direccion === 'desc' ? 'asc' : 'desc' }));
  }, []);

  return {
    ...consulta,
    filas: consulta.datos?.datos || [],
    paginacion: consulta.datos?.paginacion,
    filtros, cambiarFiltro, limpiarFiltros, setPagina, orden, ordenarPor,
  };
}
