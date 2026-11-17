// Fotos de gimnasio para las rutinas que no tienen foto propia.
// Todas son de Unsplash (https://unsplash.com/license): gratis, sin pedir permiso.
// Gracias a sus autores:
const FOTOS = [
  { id: '1646492169621-d8da8016354a', autor: 'Benjamin Brunner' },
  { id: '1589579234096-25cb6b83e021', autor: 'Nathan Dumlao' },
  { id: '1728486145245-d4cb0c9c3470', autor: 'Ambitious Studio* | Rick Barrett' },
  { id: '1687521278757-aed659b751e9', autor: 'Markus Spiske' },
  { id: '1620188467120-5042ed1eb5da', autor: 'Eduardo Cano Photo Co.' },
  { id: '1526401485004-46910ecc8e51', autor: 'Victor Freitas' },
  { id: '1521805103424-d8f8430e8933', autor: 'Victor Freitas' },
  { id: '1685633224688-6a77675eb119', autor: 'Ambitious Studio* | Rick Barrett' }
];

// Unsplash entrega la foto ya recortada y comprimida al tamaño que se pide
function urlUnsplash(id, ancho) {
  return `https://images.unsplash.com/photo-${id}?w=${ancho}&h=${Math.round(ancho * 0.5625)}&fit=crop&auto=format&q=70`;
}

// "Aleatoria" pero estable: la misma rutina siempre tiene la misma foto
export function fotoAleatoria(rutinaId, ancho = 800) {
  return urlUnsplash(FOTOS[rutinaId % FOTOS.length].id, ancho);
}

export function fotoDeRutina(rutina, ancho = 800) {
  return rutina.foto ?? fotoAleatoria(rutina.id, ancho);
}
