import { useId, useState } from 'react';
import Contador from './ui/Contador';
import Boton from './ui/Boton';

const OPCIONES_RIR = [0, 1, 2, 3, 4, 5];
const NUMERO_VALIDO = /^\d*\.?\d{0,3}$/;

export default function FormularioSerie({ objetivo, ultimaSerie, unidadUsuario, numeroSiguiente, onRegistrar }) {
  const idPeso = useId();

  const [unidad, setUnidad] = useState(unidadUsuario);
  const [peso, setPeso] = useState(ultimaSerie ? String(ultimaSerie.peso) : '');
  const [reps, setReps] = useState(ultimaSerie?.reps ?? objetivo.repsMin);
  const [rir, setRir] = useState(objetivo.rir);
  const [calentamiento, setCalentamiento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const paso = unidad === 'kg' ? 2.5 : 5;
  const pesoNumero = peso === '' ? NaN : Number(peso);

  function escribirPeso(texto) {
    const limpio = texto.replace(',', '.');
    if (NUMERO_VALIDO.test(limpio)) setPeso(limpio);
  }

  function ajustarPeso(delta) {
    const base = Number.isFinite(pesoNumero) ? pesoNumero : 0;
    setPeso(String(Math.max(0, Math.round((base + delta) * 100) / 100)));
  }

  async function registrar() {
    setError('');
    if (!Number.isFinite(pesoNumero)) {
      setError('Escribe el peso que usaste');
      return;
    }

    setEnviando(true);
    try {
      await onRegistrar({
        ejercicioId: objetivo.ejercicioId,
        peso: pesoNumero,
        unidad,
        reps,
        rir: calentamiento ? null : rir,
        esCalentamiento: calentamiento
      });
      setCalentamiento(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const botonRedondo =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevado text-xl text-neutral-50 transition hover:bg-neutral-700';

  return (
    <div className="space-y-3 border-t border-borde pt-3">
      <div className="flex items-center justify-between">
        <span className="font-extrabold">
          {calentamiento ? 'Calentamiento' : `Serie ${numeroSiguiente}`}
        </span>
        <div role="group" aria-label="Unidad" className="flex rounded-full bg-fondo p-1">
          {['kg', 'lb'].map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unidad === u}
              onClick={() => setUnidad(u)}
              className={`h-8 rounded-full px-3.5 font-mono text-sm font-bold transition
                ${unidad === u ? 'bg-primario text-fondo' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor={idPeso} className="block text-xs text-neutral-400">Peso ({unidad})</label>
          <div className="flex h-12 items-center rounded-full bg-fondo px-1">
            <button type="button" onClick={() => ajustarPeso(-paso)} aria-label={`Bajar ${paso} ${unidad}`} className={botonRedondo}>
              −
            </button>
            <input
              id={idPeso}
              type="text"
              inputMode="decimal"
              value={peso}
              onChange={(e) => escribirPeso(e.target.value)}
              placeholder="0"
              className="w-full min-w-0 bg-transparent text-center font-mono text-base font-bold outline-none placeholder:text-neutral-600"
            />
            <button type="button" onClick={() => ajustarPeso(paso)} aria-label={`Subir ${paso} ${unidad}`} className={botonRedondo}>
              +
            </button>
          </div>
        </div>
        <Contador etiqueta="Reps" valor={reps} min={1} max={100} onChange={setReps} />
      </div>

      {!calentamiento && (
        <fieldset className="space-y-1">
          <legend className="text-xs text-neutral-400">RIR · repeticiones que te quedaron en reserva</legend>
          <div className="grid grid-cols-6 gap-1.5">
            {OPCIONES_RIR.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={rir === n}
                onClick={() => setRir(n)}
                className={`h-11 rounded-full font-mono font-bold transition
                  ${rir === n ? 'bg-primario text-fondo' : 'bg-elevado text-neutral-50 hover:bg-neutral-700'}`}
              >
                {n === 5 ? '5+' : n}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={calentamiento}
        onClick={() => setCalentamiento((v) => !v)}
        className="flex w-full items-center justify-between rounded-full px-1 py-1 text-sm text-neutral-300"
      >
        Serie de calentamiento
        <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${calentamiento ? 'bg-primario' : 'bg-elevado'}`}>
          <span className={`h-5 w-5 rounded-full transition ${calentamiento ? 'translate-x-5 bg-fondo' : 'bg-neutral-400'}`} />
        </span>
      </button>

      {error && (
        <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <Boton onClick={registrar} cargando={enviando} className="w-full">Registrar serie</Boton>
    </div>
  );
}