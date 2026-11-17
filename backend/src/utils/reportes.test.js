import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  agrupacionDelPeriodo, inicioSemana, agruparPorPeriodo,
  frecuenciaPorDiaSemana, variacion, estadoVolumen, aCsv
} from './reportes.js';

test('agrupa por semana hasta 90 días y por mes después', () => {
  assert.equal(agrupacionDelPeriodo(30), 'semana');
  assert.equal(agrupacionDelPeriodo(90), 'semana');
  assert.equal(agrupacionDelPeriodo(180), 'mes');
});

test('la semana empieza en lunes', () => {
  assert.equal(inicioSemana('2026-11-16'), '2026-11-16'); // lunes
  assert.equal(inicioSemana('2026-11-22'), '2026-11-16'); // domingo
  assert.equal(inicioSemana('2026-11-01'), '2026-10-26'); // cruza de mes
});

test('agrupa por semana e incluye las semanas sin entrenar', () => {
  const dias = [
    { dia: '2026-11-02', sesiones: 1, seriesEfectivas: 12, volumenKg: 3000 },
    { dia: '2026-11-04', sesiones: 1, seriesEfectivas: 10, volumenKg: 2500 },
    { dia: '2026-11-18', sesiones: 2, seriesEfectivas: 20, volumenKg: 6000 }
  ];
  const semanas = agruparPorPeriodo(dias, { inicio: '2026-11-01', fin: '2026-11-20', agrupacion: 'semana' });

  assert.deepEqual(semanas.map((s) => s.inicio), ['2026-10-26', '2026-11-02', '2026-11-09', '2026-11-16']);
  assert.deepEqual(semanas.map((s) => s.sesiones), [0, 2, 0, 2]);
  assert.equal(semanas[1].seriesEfectivas, 22);
  assert.equal(semanas[1].volumenKg, 5500);
});

test('agrupa por mes', () => {
  const dias = [
    { dia: '2026-09-30', sesiones: 1, seriesEfectivas: 5, volumenKg: 100 },
    { dia: '2026-11-15', sesiones: 1, seriesEfectivas: 5, volumenKg: 100 }
  ];
  const meses = agruparPorPeriodo(dias, { inicio: '2026-09-15', fin: '2026-11-16', agrupacion: 'mes' });
  assert.deepEqual(meses.map((m) => [m.inicio, m.sesiones]), [
    ['2026-09-01', 1], ['2026-10-01', 0], ['2026-11-01', 1]
  ]);
});

test('cuenta las sesiones por día de la semana', () => {
  const frecuencia = frecuenciaPorDiaSemana([
    { dia: '2026-11-16', sesiones: 1 }, // lunes
    { dia: '2026-11-09', sesiones: 1 }, // lunes
    { dia: '2026-11-15', sesiones: 2 }  // domingo
  ]);
  assert.equal(frecuencia[0].dia, 'Lunes');
  assert.equal(frecuencia[0].sesiones, 2);
  assert.equal(frecuencia[6].sesiones, 2);
  assert.equal(frecuencia[3].sesiones, 0);
});

test('calcula la variación contra el periodo anterior', () => {
  assert.equal(variacion(12, 10), 20);
  assert.equal(variacion(8, 10), -20);
  assert.equal(variacion(5, 0), null);
});

test('compara el promedio semanal con el rango del músculo', () => {
  const rango = { minimo: 10, maximo: 20 };
  assert.equal(estadoVolumen(6, rango), 'bajo');
  assert.equal(estadoVolumen(10, rango), 'enRango');
  assert.equal(estadoVolumen(22.5, rango), 'alto');
});

test('genera CSV con BOM, comillas y protección contra fórmulas', () => {
  const csv = aCsv(
    [{ titulo: 'Nombre', campo: 'nombre' }, { titulo: 'Peso', campo: 'peso' }],
    [
      { nombre: 'Press, banca', peso: 80.5 },
      { nombre: 'Dice "hola"', peso: -2 },
      { nombre: '=SUMA(A1)', peso: null }
    ]
  );
  assert.ok(csv.startsWith('﻿'));
  const lineas = csv.slice(1).trimEnd().split('\r\n');
  assert.deepEqual(lineas, [
    'Nombre,Peso',
    '"Press, banca",80.5',
    '"Dice ""hola""",-2',
    "'=SUMA(A1),"
  ]);
});