import { ArrowDown, ArrowUp } from 'lucide-react';

/**
 * Tabla reutilizable con ordenamiento por columnas.
 * columnas: [{ clave, titulo, ordenable, render: (fila) => jsx }]
 */
export default function Tabla({ columnas, filas, orden, alOrdenar, claveFila = 'id' }) {
  return (
    <div className="overflow-x-auto">
      <table className="tabla w-full">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} scope="col">
                {c.ordenable ? (
                  <button type="button" className="inline-flex items-center gap-1 uppercase" onClick={() => alOrdenar(c.clave)}>
                    {c.titulo}
                    {orden?.ordenarPor === c.clave && (orden.direccion === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </button>
                ) : c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f[claveFila]}>
              {columnas.map((c) => <td key={c.clave}>{c.render ? c.render(f) : f[c.clave]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
