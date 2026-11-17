import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordsNuevos } from './records.js';

test('solo cuenta como récord superar el mejor 1RM anterior', () => {
  const records = recordsNuevos([
    { ejercicioId: 1, nombre: 'Press de banca', mejor: 106.67, anterior: 103.33 },
    { ejercicioId: 2, nombre: 'Remo con barra', mejor: 90, anterior: 90 },
    { ejercicioId: 3, nombre: 'Sentadilla', mejor: 140, anterior: 150 }
  ], 'kg');
  assert.deepEqual(records, [{ ejercicioId: 1, nombre: 'Press de banca', e1rm: 106.67, mejora: 3.34 }]);
});

test('la primera vez que haces un ejercicio no es récord', () => {
  assert.deepEqual(recordsNuevos([{ ejercicioId: 4, nombre: 'Hip thrust', mejor: 150, anterior: null }], 'kg'), []);
});

test('ordena por mejora y convierte a lb', () => {
  const records = recordsNuevos([
    { ejercicioId: 1, nombre: 'A', mejor: 101, anterior: 100 },
    { ejercicioId: 2, nombre: 'B', mejor: 105, anterior: 100 }
  ], 'lb');
  assert.equal(records[0].nombre, 'B');
  assert.equal(records[0].mejora, 11.02);
});
