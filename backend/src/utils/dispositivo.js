/**
 * Describe de forma breve el navegador y el sistema operativo a partir del
 * encabezado User-Agent (por ejemplo, "Chrome · Android"). Se usa en la auditoría
 * de inicios y cierres de sesión.
 */
function describirDispositivo(userAgent = '') {
  const ua = String(userAgent);
  let navegador = 'Navegador desconocido';
  if (/Edg\//.test(ua)) navegador = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) navegador = 'Opera';
  else if (/SamsungBrowser/.test(ua)) navegador = 'Samsung Internet';
  else if (/Firefox\//.test(ua)) navegador = 'Firefox';
  else if (/Chrome\//.test(ua)) navegador = 'Chrome';
  else if (/Safari\//.test(ua)) navegador = 'Safari';
  else if (/PostmanRuntime/.test(ua)) navegador = 'Postman';

  let sistema = '';
  if (/Android/.test(ua)) sistema = 'Android';
  else if (/iPhone|iPad/.test(ua)) sistema = 'iOS';
  else if (/Windows/.test(ua)) sistema = 'Windows';
  else if (/Mac OS X/.test(ua)) sistema = 'macOS';
  else if (/Linux/.test(ua)) sistema = 'Linux';

  return sistema ? `${navegador} · ${sistema}` : navegador;
}

module.exports = { describirDispositivo };
