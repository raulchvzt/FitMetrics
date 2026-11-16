import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularSugerencia, detectarEstancamiento, incrementoEnUnidad } from './sobrecarga.js';

const objetivo = { series: 3, repsMin: 8, repsMax: 12, rir: 2 };
const serie = (pesoKg, reps, rir = 2, e1rm = pesoKg * (1 + reps / 30)) => ({ pesoKg, reps, rir, e1rm });
const sesion = (...series) => ({ series });

test('sin historial pide elegir un peso inicial', () => {
  const s = calcularSugerencia({ objetivo, sesiones: [], unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.tipo, 'inicial');
  assert.equal(s.peso, null);
  assert.equal(s.reps, 8);
});

test('si completó el máximo de reps en todas las series, sube el peso y regresa al mínimo', () => {
  const sesiones = [sesion(serie(80, 12), serie(80, 12), serie(80, 12))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.tipo, 'subir');
  assert.equal(s.peso, 82.5);
  assert.equal(s.reps, 8);
});

test('si le faltan series para completar el objetivo, no sube aunque llegue al máximo', () => {
  const sesiones = [sesion(serie(80, 12), serie(80, 12))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.tipo, 'mantener');
});

test('dentro del rango mantiene el peso y pide una rep más que su peor serie', () => {
  const sesiones = [sesion(serie(80, 10), serie(80, 9), serie(80, 8))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.tipo, 'mantener');
  assert.equal(s.peso, 80);
  assert.equal(s.reps, 9);
});

test('si fue demasiado fácil (RIR 2 por encima del objetivo), sube aunque no llegue al máximo', () => {
  const sesiones = [sesion(serie(80, 10, 4), serie(80, 10, 4), serie(80, 10, 4))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.tipo, 'subir');
  assert.equal(s.peso, 82.5);
});

test('si ninguna serie llegó al mínimo, baja el peso', () => {
  const sesiones = [sesion(serie(90, 6, 0), serie(90, 5, 0), serie(90, 4, 0))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.tipo, 'bajar');
  assert.equal(s.peso, 87.5);
});

test('una última serie corta por fatiga no hace bajar el peso', () => {
  const sesiones = [sesion(serie(80, 9), serie(80, 8), serie(80, 6))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.tipo, 'mantener');
  assert.equal(s.peso, 80);
});

test('usa solo las series con el peso más alto de la sesión', () => {
  const sesiones = [sesion(serie(60, 12), serie(80, 12), serie(80, 12), serie(80, 12))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.tipo, 'subir');
  assert.equal(s.peso, 82.5);
});

test('en libras sugiere saltos de 5 lb', () => {
  const kg135lb = 61.235;
  const sesiones = [sesion(serie(kg135lb, 12), serie(kg135lb, 12), serie(kg135lb, 12))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'lb', incrementoKg: 2.5 });
  assert.equal(s.peso, 140);
  assert.equal(s.unidad, 'lb');
});

test('convierte incrementos a libras redondeando a 2.5', () => {
  assert.equal(incrementoEnUnidad(2.5, 'lb'), 5);
  assert.equal(incrementoEnUnidad(1.25, 'lb'), 2.5);
  assert.equal(incrementoEnUnidad(5, 'lb'), 10);
  assert.equal(incrementoEnUnidad(2.5, 'kg'), 2.5);
});

test('ejercicio con peso corporal: nunca sugiere peso negativo', () => {
  const sesiones = [sesion(serie(0, 5, 0, 0), serie(0, 4, 0, 0), serie(0, 4, 0, 0))];
  const s = calcularSugerencia({ objetivo, sesiones, unidad: 'kg', incrementoKg: 2.5 });
  assert.equal(s.peso, 0);
  assert.equal(s.tipo, 'mantener');
});

test('detecta estancamiento si el 1RM no supera al de hace 4 sesiones', () => {
  const s = (e1rm) => sesion({ pesoKg: 0, reps: 0, rir: 2, e1rm });
  assert.equal(detectarEstancamiento([s(100), s(99), s(100), s(100)]), true);
  assert.equal(detectarEstancamiento([s(101), s(99), s(100), s(100)]), false);
  assert.equal(detectarEstancamiento([s(100), s(100), s(100)]), false);
});