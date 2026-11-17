// Recorta y achica una foto en el teléfono antes de subirla.
// Una foto del iPhone pesa varios MB; recortada a 400x400 en JPEG queda en unos 40 KB.

const LARGO_MAXIMO = 400_000; // igual que en el backend

function cargarImagen(archivo) {
  const url = URL.createObjectURL(archivo);
  const imagen = new Image();
  imagen.src = url;
  // decode() respeta la orientación de la foto (girada, vertical, etc.)
  return imagen.decode()
    .then(() => imagen)
    .catch(() => {
      throw new Error('No se pudo leer la imagen. Prueba con otra foto.');
    })
    .finally(() => URL.revokeObjectURL(url));
}

// Recorta al centro para llenar ancho x alto (como object-fit: cover)
export async function reducirImagen(archivo, { ancho, alto }) {
  if (!archivo?.type.startsWith('image/')) {
    throw new Error('Elige un archivo de imagen');
  }

  const imagen = await cargarImagen(archivo);
  const escala = Math.max(ancho / imagen.naturalWidth, alto / imagen.naturalHeight);
  const w = imagen.naturalWidth * escala;
  const h = imagen.naturalHeight * escala;

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const contexto = lienzo.getContext('2d');
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(imagen, (ancho - w) / 2, (alto - h) / 2, w, h);

  // Si quedara muy pesada, se baja la calidad hasta que quepa
  for (const calidad of [0.85, 0.75, 0.6, 0.45]) {
    const resultado = lienzo.toDataURL('image/jpeg', calidad);
    if (resultado.length <= LARGO_MAXIMO) return resultado;
  }
  throw new Error('La imagen es demasiado pesada. Prueba con otra foto.');
}
