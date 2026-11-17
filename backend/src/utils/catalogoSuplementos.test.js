import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGO_SUPLEMENTOS, SECCIONES_SUPLEMENTO } from './catalogoSuplementos.js';
import { UNIDADES_SUPLEMENTO } from '../controllers/suplementos.controller.js';

const SECCIONES = new Set(SECCIONES_SUPLEMENTO.map((s) => s.id));
const ILUSTRACIONES = new Set(['polvo', 'capsulas', 'tabletas', 'liquido', 'sobre']);

test('cada suplemento del catálogo se puede guardar tal cual', () => {
  for (const c of CATALOGO_SUPLEMENTOS) {
    assert.ok(UNIDADES_SUPLEMENTO.includes(c.unidad), `${c.id}: unidad ${c.unidad}`);
    assert.ok(['Diario', 'DiaEntreno'].includes(c.frecuencia), `${c.id}: frecuencia`);
    assert.ok(['Cualquiera', 'AntesEntrenar', 'DespuesEntrenar'].includes(c.momento), `${c.id}: momento`);
    assert.ok(c.dosis > 0, `${c.id}: dosis`);
    assert.ok(SECCIONES.has(c.seccion), `${c.id}: sección`);
    assert.ok(ILUSTRACIONES.has(c.ilustracion), `${c.id}: ilustración`);
    assert.ok(c.nombre.length <= 100);
  }
});

test('los ids y los nombres no se repiten', () => {
  const ids = CATALOGO_SUPLEMENTOS.map((c) => c.id);
  const nombres = CATALOGO_SUPLEMENTOS.map((c) => c.nombre);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(nombres).size, nombres.length);
  assert.ok(ids.every((id) => id.length <= 30));
});

test('sección e ilustración de un suplemento escrito a mano', async () => {
  const { ilustracionDe, seccionDe } = await import('./catalogoSuplementos.js');
  assert.equal(ilustracionDe({ catalogo: 'omega3', unidad: 'g' }), 'capsulas');
  assert.equal(ilustracionDe({ catalogo: null, unidad: 'ml' }), 'liquido');
  assert.equal(ilustracionDe({ catalogo: null, unidad: 'tableta' }), 'tabletas');
  assert.equal(seccionDe({ catalogo: 'whey' }), 'proteina');
  assert.equal(seccionDe({ catalogo: null }), 'otros');
});
