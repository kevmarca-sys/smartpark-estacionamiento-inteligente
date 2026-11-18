/**
 * Traductor de la interfaz
 *
 * Traduce los textos visibles de la página (nodos de texto y los atributos
 * placeholder, title y aria-label) usando el diccionario. Un MutationObserver
 * traduce también lo que React vuelve a dibujar, por lo que no es necesario
 * modificar cada componente. Al volver a español se restauran los textos originales.
 */

import { DICCIONARIO_EN, PATRONES_EN } from './diccionario';

const ATRIBUTOS = ['placeholder', 'title', 'aria-label'];
const NO_TRADUCIR = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE']);

let idiomaActual = 'es';
let observador = null;
const textosTraducidos = new Map(); // nodo de texto → { es, en }
const atributosTraducidos = new Map(); // elemento → { atributo: { es, en } }

/** Devuelve la traducción de un texto o null si no está en el diccionario. */
function traducir(texto) {
  const limpio = texto.trim();
  if (!limpio) return null;
  let traducido = DICCIONARIO_EN[limpio];
  if (traducido === undefined) {
    const patron = PATRONES_EN.find(([expresion]) => expresion.test(limpio));
    if (patron) traducido = limpio.replace(patron[0], patron[1]);
  }
  return traducido === undefined ? null : texto.replace(limpio, traducido);
}

function traducirNodoTexto(nodo) {
  const padre = nodo.parentElement;
  if (!padre || NO_TRADUCIR.has(padre.tagName) || padre.closest('[translate="no"]')) return;
  const actual = nodo.nodeValue;
  const previo = textosTraducidos.get(nodo);
  if (previo && previo.en === actual) return;
  const en = traducir(actual);
  if (en !== null && en !== actual) {
    textosTraducidos.set(nodo, { es: actual, en });
    nodo.nodeValue = en;
  }
}

function traducirAtributos(elemento) {
  ATRIBUTOS.forEach((atributo) => {
    const actual = elemento.getAttribute(atributo);
    if (!actual) return;
    const guardados = atributosTraducidos.get(elemento) || {};
    if (guardados[atributo]?.en === actual) return;
    const en = traducir(actual);
    if (en !== null && en !== actual) {
      guardados[atributo] = { es: actual, en };
      atributosTraducidos.set(elemento, guardados);
      elemento.setAttribute(atributo, en);
    }
  });
}

function recorrer(raiz) {
  if (raiz.nodeType === Node.TEXT_NODE) { traducirNodoTexto(raiz); return; }
  if (raiz.nodeType !== Node.ELEMENT_NODE) return;
  traducirAtributos(raiz);
  const caminante = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let nodo = caminante.nextNode(); nodo; nodo = caminante.nextNode()) {
    if (nodo.nodeType === Node.TEXT_NODE) traducirNodoTexto(nodo);
    else traducirAtributos(nodo);
  }
}

function restaurar() {
  textosTraducidos.forEach(({ es, en }, nodo) => { if (nodo.nodeValue === en) nodo.nodeValue = es; });
  atributosTraducidos.forEach((guardados, elemento) => {
    Object.entries(guardados).forEach(([atributo, { es, en }]) => {
      if (elemento.getAttribute(atributo) === en) elemento.setAttribute(atributo, es);
    });
  });
  textosTraducidos.clear();
  atributosTraducidos.clear();
}

/** Cambia el idioma de toda la interfaz: 'es' (original) o 'en'. */
export function aplicarIdioma(idioma) {
  idiomaActual = idioma;
  document.documentElement.lang = idioma;
  observador?.disconnect();
  observador = null;
  if (idioma === 'es') { restaurar(); return; }

  recorrer(document.body);
  observador = new MutationObserver((cambios) => {
    if (idiomaActual !== 'en') return;
    cambios.forEach((cambio) => {
      if (cambio.type === 'characterData') traducirNodoTexto(cambio.target);
      else if (cambio.type === 'attributes') traducirAtributos(cambio.target);
      else cambio.addedNodes.forEach(recorrer);
    });
  });
  observador.observe(document.body, {
    childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS,
  });
}
