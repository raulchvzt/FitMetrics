// Fotos de un ejercicio: la propia (si el usuario subió una) o las 2 del catálogo
// (posición inicial y final, guardadas en public/ejercicios/<carpeta>/).
export function fotosDeEjercicio(ejercicio) {
  if (!ejercicio) return [];
  if (ejercicio.foto) return [ejercicio.foto];
  if (ejercicio.imagen) return [0, 1].map((n) => `/ejercicios/${ejercicio.imagen}/${n}.webp`);
  return [];
}
