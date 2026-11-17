// Configuración de seguridad que cambia entre tu PC y el servidor publicado.

// Orígenes (dominios) que pueden llamar a la API desde el navegador.
// En desarrollo el frontend usa el proxy de Vite, así que las peticiones son
// del mismo origen y CORS ni siquiera interviene; esta lista importa al publicar.
// Ejemplo en .env: CORS_ORIGINS=https://fitmetrics.vercel.app
export function origenesPermitidos(env = process.env) {
  const lista = (env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return new Set(lista);
}

// Detrás de un proxy (Render, Railway, Nginx) la IP real llega en X-Forwarded-For.
// Solo se confía en ese encabezado si se configura, para que no lo falsifiquen.
export function confiarEnProxy(env = process.env) {
  const valor = env.TRUST_PROXY;
  if (!valor) return false;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : valor;
}

// Un secreto corto se puede adivinar por fuerza bruta y falsificar tokens
export const LARGO_MINIMO_SECRETO = 32;

export function revisarSecretoJwt(secreto) {
  if (!secreto) return 'Falta JWT_SECRET en el archivo .env';
  if (secreto.length < LARGO_MINIMO_SECRETO) {
    return `JWT_SECRET debe tener al menos ${LARGO_MINIMO_SECRETO} caracteres. ` +
      'Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"';
  }
  return null;
}
