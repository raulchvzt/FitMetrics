import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarEjercicio } from './ejercicios.controller.js';

const base = { nombre: '  Press  en   máquina convergente ', equipo: 'Máquina', incrementoKg: 5, principal: 1, secundarios: [7] };

test('normaliza el nombre y calcula tipo y músculos', () => {
  const datos = validarEjercicio(base);
  assert.equal(datos.nombre, 'Press en máquina convergente');
  assert.equal(datos.tipo, 'Compuesto');
  assert.deepEqual(datos.musculos, [{ grupoMuscularId: 1, factor: 1 }, { grupoMuscularId: 7, factor: 0.5 }]);
});

test('sin secundarios es de aislamiento', () => {
  assert.equal(validarEjercicio({ ...base, secundarios: [] }).tipo, 'Aislamiento');
});

test('rechaza datos inválidos', () => {
  const casos = [
    { ...base, nombre: '   ' },
    { ...base, equipo: 'Kettlebell' },
    { ...base, incrementoKg: 3 },
    { ...base, principal: undefined },
    { ...base, secundarios: [1] },
    { ...base, secundarios: [2, 2] },
    { ...base, secundarios: [2, 3, 4, 5] }
  ];
  for (const caso of casos) {
    assert.throws(() => validarEjercicio(caso), (err) => err.status === 400, JSON.stringify(caso));
  }
});
