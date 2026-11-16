import { desdeKg } from './unidades.js';

// Reglas del motor de sobrecarga progresiva (doble progresión).
// Recibe el objetivo de la rutina y las últimas sesiones del ejercicio,
// y devuelve una sugerencia para hoy. Todo se calcula en la unidad del usuario.

const redondear = (valor) => Math.round(valor * 100) / 100;

// 2.5 kg → 5 lb, 1.25 kg → 2.5 lb, 5 kg → 10 lb
export function incrementoEnUnidad(incrementoKg, unidad) {
  if (unidad !== 'lb') return incrementoKg;
  return Math.max(2.5, Math.round((incrementoKg * 2.20462) / 2.5) * 2.5);
}

export function detectarEstancamiento(sesiones) {
  if (sesiones.length < 4) return false;
  const mejores = sesiones.slice(0, 4).map((s) => Math.max(...s.series.map((serie) => serie.e1rm ?? 0)));
  if (mejores.every((valor) => valor === 0)) return false;
  const [s1, s2, s3, referencia] = mejores;
  return Math.max(s1, s2, s3) <= referencia;
}

export function calcularSugerencia({ objetivo, sesiones, unidad, incrementoKg }) {
  const { series: seriesObjetivo, repsMin, repsMax, rir: rirObjetivo } = objetivo;

  if (sesiones.length === 0) {
    return {
      tipo: 'inicial',
      peso: null,
      reps: repsMin,
      unidad,
      estancado: false,
      mensaje: `Primera vez: elige un peso con el que hagas ${repsMin}–${repsMax} reps dejando ${rirObjetivo} en reserva.`
    };
  }

  const ultima = sesiones[0].series;
  const pesoTopKg = Math.max(...ultima.map((s) => s.pesoKg));
  const delPesoTop = ultima.filter((s) => s.pesoKg === pesoTopKg);

  const repsMenor = Math.min(...delPesoTop.map((s) => s.reps));
  const repsMayor = Math.max(...delPesoTop.map((s) => s.reps));
  const conRir = delPesoTop.filter((s) => s.rir !== null && s.rir !== undefined);
  const rirPromedio = conRir.length > 0 ? conRir.reduce((t, s) => t + s.rir, 0) / conRir.length : null;

  const peso = desdeKg(pesoTopKg, unidad);
  const incremento = incrementoEnUnidad(incrementoKg, unidad);
  const estancado = detectarEstancamiento(sesiones);
  const conPeso = (texto) => (peso > 0 ? texto : texto.replace(/ con \S+ \S+/, ''));

  const completoTodo = delPesoTop.length >= seriesObjetivo && repsMenor >= repsMax;
  const demasiadoFacil = rirPromedio !== null && rirPromedio >= rirObjetivo + 2 && repsMenor >= repsMin;

  if (completoTodo || demasiadoFacil) {
    const nuevo = redondear(peso + incremento);
    return {
      tipo: 'subir',
      peso: nuevo,
      reps: repsMin,
      unidad,
      estancado,
      mensaje: completoTodo
        ? `Completaste ${repsMax} reps en todas las series con ${peso} ${unidad}: sube a ${nuevo} ${unidad} y vuelve a ${repsMin}.`
        : `Te sobraron repeticiones (RIR ${Math.round(rirPromedio)} en promedio): sube a ${nuevo} ${unidad}.`
    };
  }

  if (repsMayor < repsMin) {
    if (peso === 0) {
      return {
        tipo: 'mantener',
        peso: 0,
        reps: repsMin,
        unidad,
        estancado,
        mensaje: `No llegaste a ${repsMin} reps: usa asistencia o haz series más cortas hasta llegar al rango.`
      };
    }
    const nuevo = redondear(Math.max(0, peso - incremento));
    return {
      tipo: 'bajar',
      peso: nuevo,
      reps: repsMin,
      unidad,
      estancado,
      mensaje: `No llegaste a ${repsMin} reps con ${peso} ${unidad}: baja a ${nuevo} ${unidad} para entrar en tu rango.`
    };
  }

  const meta = Math.min(repsMax, repsMenor + 1);
  return {
    tipo: 'mantener',
    peso,
    reps: meta,
    unidad,
    estancado,
    mensaje: conPeso(`Mantén el peso con ${peso} ${unidad} y busca ${meta} reps en todas las series.`)
  };
}