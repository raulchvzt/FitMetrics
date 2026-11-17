import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esImagenValida, LARGO_MAXIMO_IMAGEN } from './imagenes.js';

const dataUrl = (tipo, bytes) => `data:image/${tipo};base64,${Buffer.from(bytes).toString('base64')}`;

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const WEBP = [...Buffer.from('RIFF'), 0x24, 0x00, 0x00, 0x00, ...Buffer.from('WEBPVP8 ')];

test('acepta JPEG, PNG y WebP reales', () => {
  assert.equal(esImagenValida(dataUrl('jpeg', JPEG)), true);
  assert.equal(esImagenValida(dataUrl('png', PNG)), true);
  assert.equal(esImagenValida(dataUrl('webp', WEBP)), true);
});

test('rechaza contenido que no corresponde al tipo declarado', () => {
  assert.equal(esImagenValida(dataUrl('jpeg', PNG)), false);
  assert.equal(esImagenValida(dataUrl('png', Buffer.from('<script>alert(1)</script>'))), false);
});

test('rechaza formatos no permitidos o texto que no es data URL', () => {
  assert.equal(esImagenValida(dataUrl('svg+xml', Buffer.from('<svg/>'))), false);
  assert.equal(esImagenValida('https://ejemplo.com/foto.jpg'), false);
  assert.equal(esImagenValida(null), false);
  assert.equal(esImagenValida(`${dataUrl('jpeg', JPEG)}"onerror="x`), false);
});

test('rechaza imágenes demasiado grandes', () => {
  const grande = dataUrl('jpeg', JPEG) + 'A'.repeat(LARGO_MAXIMO_IMAGEN);
  assert.equal(esImagenValida(grande), false);
});
