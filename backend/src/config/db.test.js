import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esErrorTemporal } from './db.js';

test('reconoce cuando Azure SQL está despertando', () => {
  assert.equal(esErrorTemporal({ number: 40613 }), true);
  assert.equal(esErrorTemporal({ originalError: { info: { number: 40613 } } }), true);
});

test('no reintenta errores que no se arreglan esperando', () => {
  assert.equal(esErrorTemporal({ number: 18456 }), false); // contraseña incorrecta
  assert.equal(esErrorTemporal({ code: 'ELOGIN' }), false);
  assert.equal(esErrorTemporal({ code: 'ETIMEOUT' }), false); // firewall: esperar no sirve
  assert.equal(esErrorTemporal(null), false);
});
