import { useId } from 'react';

/** Campo de formulario con etiqueta, ayuda y mensaje de error accesible. */
export default function Campo({ etiqueta, error, ayuda, como = 'input', opciones, className = '', ...props }) {
  const id = useId();
  const Elemento = como;
  const clase = `entrada ${error ? 'entrada-error' : ''}`;
  return (
    <div className={className}>
      {etiqueta && <label htmlFor={id} className="etiqueta">{etiqueta}{props.required && <span className="text-ocupado"> *</span>}</label>}
      {como === 'select' ? (
        <select id={id} className={clase} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-e` : undefined} {...props}>
          {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
        </select>
      ) : (
        <Elemento id={id} className={clase} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-e` : undefined} {...props} />
      )}
      {error ? <p id={`${id}-e`} role="alert" className="mt-1 text-xs text-ocupado-oscuro">{error}</p>
        : ayuda && <p className="mt-1 text-xs text-slate-500">{ayuda}</p>}
    </div>
  );
}
