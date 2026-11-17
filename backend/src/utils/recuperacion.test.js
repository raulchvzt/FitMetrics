import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pesoPorRir, cargaPendiente, porcentaje, recuperacionDe, estadoDelCuerpo, horasDe, CARGA_MAXIMA
} from './recuperacion.js';

const serie = (horas, rir = 2, factor = 1) => ({ horas, rir, factor });

test('las series más pesadas (RIR bajo) cansan más', () => {
  assert.ok(pesoPorRir(0) > pesoPorRir(1));
  assert.ok(pesoPorRir(1) > pesoPorRir(3));
  assert.equal(pesoPorRir(2), 1);
});

test('sin series recientes el músculo está al 100 %', () => {
  assert.deepEqual(recuperacionDe([], 60), { recuperacion: 100, horasParaListo: 0 });
});

test('la carga baja con el tiempo y desaparece al terminar la recuperación', () => {
  const series = [serie(0), serie(0)];
  assert.equal(cargaPendiente(series, 48), 2);
  assert.equal(cargaPendiente(series, 48, 24), 1);
  assert.equal(cargaPendiente(series, 48, 48), 0);
  assert.equal(cargaPendiente([serie(50)], 48), 0);
});

test('una serie secundaria cuenta la mitad', () => {
  assert.equal(cargaPendiente([serie(0, 2, 0.5)], 48), 0.5);
});

test('el porcentaje no baja de 0', () => {
  assert.equal(porcentaje(0), 100);
  assert.equal(porcentaje(CARGA_MAXIMA / 2), 50);
  assert.equal(porcentaje(CARGA_MAXIMA * 3), 0);
});

test('6 series de pecho recién hechas: cansado y listo antes de 60 h', () => {
  const series = Array.from({ length: 6 }, () => serie(1));
  const { recuperacion, horasParaListo } = recuperacionDe(series, 60);
  assert.ok(recuperacion < 50);
  assert.ok(horasParaListo > 0 && horasParaListo < 60);
  // A esa hora ya está listo y una hora antes todavía no
  const despues = porcentaje(cargaPendiente(series, 60, horasParaListo));
  const antes = porcentaje(cargaPendiente(series, 60, horasParaListo - 1));
  assert.ok(despues >= 80 && antes < 80);
});

test('los músculos chicos se recuperan más rápido que los grandes', () => {
  assert.ok(horasDe('Hombro lateral') < horasDe('Cuádriceps'));
  assert.equal(horasDe('Músculo nuevo'), 48);
});

test('arma el estado de cada músculo con su volumen, recuperación y última vez', () => {
  const estado = estadoDelCuerpo({
    volumen: [
      { id: 1, musculo: 'Pecho', series: 14, minimo: 10, maximo: 20 },
      { id: 11, musculo: 'Pantorrillas', series: 0, minimo: 8, maximo: 14 }
    ],
    recientes: [
      { grupoMuscularId: 1, factor: 1, rir: 1, horas: 20 },
      { grupoMuscularId: 1, factor: 1, rir: 2, horas: 20 }
    ],
    ultimas: [{ grupoMuscularId: 1, dias: 1, series: 2 }]
  });

  assert.equal(estado[0].nombre, 'Pecho');
  assert.ok(estado[0].recuperacion < 100);
  assert.deepEqual(estado[0].ultimaVez, { dias: 1, series: 2 });
  assert.equal(estado[1].recuperacion, 100);
  assert.equal(estado[1].ultimaVez, null);
});
