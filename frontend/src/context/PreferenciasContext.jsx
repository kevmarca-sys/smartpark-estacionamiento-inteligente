/**
 * Contexto de preferencias visuales
 *
 * Guarda el tema (claro u oscuro) y el idioma (español o inglés) elegidos por el
 * usuario en el navegador, y los aplica a toda la aplicación.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { aplicarIdioma } from '../i18n/traductor';

const PreferenciasContext = createContext(null);

function leer(clave, valorPorDefecto) {
  try { return localStorage.getItem(clave) || valorPorDefecto; } catch { return valorPorDefecto; }
}
function guardar(clave, valor) {
  try { localStorage.setItem(clave, valor); } catch { /* el navegador no permite guardar */ }
}

/** Tema inicial: el guardado o, si no hay, el del sistema operativo. */
function temaInicial() {
  const sistema = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  return leer('smartpark_tema', sistema);
}

export function PreferenciasProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);
  const [idioma, setIdioma] = useState(() => leer('smartpark_idioma', 'es'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro');
    guardar('smartpark_tema', tema);
  }, [tema]);

  useEffect(() => {
    aplicarIdioma(idioma);
    guardar('smartpark_idioma', idioma);
  }, [idioma]);

  const valor = useMemo(() => ({
    tema,
    idioma,
    alternarTema: () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro')),
    alternarIdioma: () => setIdioma((i) => (i === 'es' ? 'en' : 'es')),
  }), [tema, idioma]);

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}

export const usePreferencias = () => useContext(PreferenciasContext);
