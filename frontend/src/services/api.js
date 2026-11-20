const TOKEN_KEY = 'fitmetrics_token';

export const tokenStorage = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* sin almacenamiento */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento */ }
  }
};

// Se dispara cuando el servidor rechaza el token: AuthProvider cierra la sesión
export const EVENTO_SESION_EXPIRADA = 'fitmetrics:sesion-expirada';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// En la nube gratuita el servidor y la base se duermen si nadie los usa.
// Si una petición tarda, se avisa que está despertando (lo muestra AvisosApp).
export const EVENTO_DESPERTANDO = 'fitmetrics:despertando';
const AVISAR_DESPUES_MS = 3500;
let lentas = 0;

function avisarDespertando() {
  window.dispatchEvent(new CustomEvent(EVENTO_DESPERTANDO, { detail: lentas > 0 }));
}

async function conAvisoSiTarda(promesa) {
  let marcada = false;
  const temporizador = setTimeout(() => {
    marcada = true;
    lentas += 1;
    avisarDespertando();
  }, AVISAR_DESPUES_MS);
  try {
    return await promesa;
  } finally {
    clearTimeout(temporizador);
    if (marcada) {
      lentas -= 1;
      avisarDespertando();
    }
  }
}

// El proxy responde 502/503/504 si el servidor todavía no termina de despertar
const SERVIDOR_DESPERTANDO = new Set([502, 503, 504]);

// Hace la petición con el token y convierte los errores en ApiError
async function peticion(ruta, { method = 'GET', body } = {}) {
  const headers = {};
  const token = tokenStorage.get();

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await conAvisoSiTarda(fetch(`/api${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    }));
  } catch {
    throw new ApiError(
      navigator.onLine === false
        ? 'Sin conexión: este cambio necesita internet. Inténtalo cuando vuelvas a tener señal.'
        : 'No se pudo conectar con el servidor',
      0
    );
  }

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => null);
    // 401 con token = la sesión venció. (En login/registro un 401 es otra cosa: contraseña incorrecta)
    if (respuesta.status === 401 && token && !ruta.startsWith('/auth/login') && !ruta.startsWith('/auth/registro')) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    const mensaje = datos?.error ?? (SERVIDOR_DESPERTANDO.has(respuesta.status)
      ? 'El servidor está despertando. Inténtalo de nuevo en unos segundos.'
      : 'Ocurrió un error inesperado');
    throw new ApiError(mensaje, respuesta.status);
  }
  // Mientras despierta, Render puede contestar con su página de "cargando" en lugar de datos
  if (respuesta.headers.get('Content-Type')?.includes('text/html')) {
    throw new ApiError('El servidor está despertando. Inténtalo de nuevo en unos segundos.', 503);
  }
  return respuesta;
}

export async function api(ruta, opciones) {
  const respuesta = await peticion(ruta, opciones);
  if (respuesta.status === 204) return null;
  return respuesta.json().catch(() => null);
}

// Descarga un archivo (PDF, CSV) que necesita el token para generarse
export async function descargar(ruta) {
  const respuesta = await peticion(ruta);
  const archivo = await respuesta.blob();

  const disposicion = respuesta.headers.get('Content-Disposition') ?? '';
  const nombre = /filename="?([^";]+)"?/.exec(disposicion)?.[1] ?? 'fitmetrics';

  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se libera después para no cortar la descarga en navegadores lentos
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}