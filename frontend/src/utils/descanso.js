const clave = (sesionId) => `fitmetrics_descanso_${sesionId}`;

export function leerDescanso(sesionId) {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave(sesionId)));
    return guardado?.finEn ? guardado : null;
  } catch {
    return null;
  }
}

export function guardarDescanso(sesionId, descanso) {
  try {
    if (descanso) localStorage.setItem(clave(sesionId), JSON.stringify(descanso));
    else localStorage.removeItem(clave(sesionId));
  } catch {
    /* sin almacenamiento: el descanso solo vive mientras la página esté abierta */
  }
}