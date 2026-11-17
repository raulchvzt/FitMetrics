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

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Hace la petición con el token y convierte los errores en ApiError
async function peticion(ruta, { method = 'GET', body } = {}) {
  const headers = {};
  const token = tokenStorage.get();

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
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
    throw new ApiError(datos?.error ?? 'Ocurrió un error inesperado', respuesta.status);
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