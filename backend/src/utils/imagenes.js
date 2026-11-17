// Validación de imágenes que llegan como "data URL" (data:image/jpeg;base64,...).

// Debe coincidir con el CHECK de la base de datos (alrededor de 290 KB de imagen)
export const LARGO_MAXIMO_IMAGEN = 400_000;

const FORMATO = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

// Los primeros bytes de cada formato: así no basta con decir que es imagen, tiene que serlo
const FIRMAS = {
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG',
  webp: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
};

export function esImagenValida(texto) {
  if (typeof texto !== 'string' || texto.length > LARGO_MAXIMO_IMAGEN) return false;

  const coincidencia = FORMATO.exec(texto);
  if (!coincidencia) return false;

  const [, tipo, base64] = coincidencia;
  const inicio = Buffer.from(base64.slice(0, 16), 'base64');
  return FIRMAS[tipo](inicio);
}
