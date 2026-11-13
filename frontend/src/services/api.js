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

export async function api(ruta, { method = 'GET', body } = {}) {
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
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  if (respuesta.status === 204) return null;

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ApiError(datos?.error ?? 'Ocurrió un error inesperado', respuesta.status);
  }
  return datos;
}