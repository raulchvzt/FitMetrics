import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENTRENOS_POR_DEFECTO, entrenosPorSemana, estadoInventario, pendienteHoy } from './suplementos.js';

test('calcula los entrenamientos por semana con las últimas 4 semanas', () => {
  assert.equal(entrenosPorSemana(16), 4);
  assert.equal(entrenosPorSemana(10), 2.5);
});

test('sin historial suficiente supone 3 entrenamientos por semana', () => {
  assert.equal(entrenosPorSemana(0), ENTRENOS_POR_DEFECTO);
  assert.equal(entrenosPorSemana(2), ENTRENOS_POR_DEFECTO);
});

test('suplemento diario: cada toma dura un día', () => {
  const estado = estadoInventario({ stock: 300, dosis: 5, frecuencia: 'Diario', diasAlerta: 7 }, 4);
  assert.equal(estado.tomasRestantes, 60);
  assert.equal(estado.diasRestantes, 60);
  assert.equal(estado.requiereReposicion, false);
});

test('suplemento de día de entreno: dura según cuántas veces entrenas', () => {
  // 8 scoops, 4 entrenamientos por semana → 2 semanas = 14 días
  const estado = estadoInventario({ stock: 8, dosis: 1, frecuencia: 'DiaEntreno', diasAlerta: 7 }, 4);
  assert.equal(estado.diasRestantes, 14);
});

test('avisa reposición cuando los días restantes llegan al límite de alerta', () => {
  const estado = estadoInventario({ stock: 35, dosis: 5, frecuencia: 'Diario', diasAlerta: 7 }, 4);
  assert.equal(estado.diasRestantes, 7);
  assert.equal(estado.requiereReposicion, true);
});

test('las sobras que no completan una dosis no cuentan', () => {
  const estado = estadoInventario({ stock: 4.5, dosis: 5, frecuencia: 'Diario', diasAlerta: 7 }, 4);
  assert.equal(estado.tomasRestantes, 0);
  assert.equal(estado.agotado, true);
});

test('recordatorio de hoy: diario siempre; de entreno solo si entrenaste', () => {
  const diario = { frecuencia: 'Diario', tomadoHoy: false, agotado: false };
  const entreno = { frecuencia: 'DiaEntreno', tomadoHoy: false, agotado: false };
  assert.equal(pendienteHoy(diario, false), true);
  assert.equal(pendienteHoy(entreno, false), false);
  assert.equal(pendienteHoy(entreno, true), true);
});

test('no recuerda lo que ya tomaste hoy ni lo que se te acabó', () => {
  assert.equal(pendienteHoy({ frecuencia: 'Diario', tomadoHoy: true, agotado: false }, true), false);
  assert.equal(pendienteHoy({ frecuencia: 'Diario', tomadoHoy: false, agotado: true }, true), false);
});