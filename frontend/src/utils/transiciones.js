// Dirección de la próxima transición entre pantallas (la usa el CSS de index.css):
// "adelante" = entrar a algo (desliza a la izquierda), "atras" = volver, "tab" = cambiar de sección
export function marcarDireccion(direccion) {
  document.documentElement.dataset.direccion = direccion;
}

export const conTransiciones = typeof document !== 'undefined' && 'startViewTransition' in document;
