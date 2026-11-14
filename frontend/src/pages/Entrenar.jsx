import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { plural } from '../utils/formato';
import Boton from '../components/ui/Boton';
import Icono from '../components/ui/Icono';
import HojaInferior from '../components/ui/HojaInferior';
import Cronometro from '../components/Cronometro';

function Aviso({ children }) {
  return (
    <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
      {children}
    </div>
  );
}

function BotonVolver() {
  return (
    <Link
      to="/"
      aria-label="Volver al inicio"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
    >
      <Icono nombre="atras" className="h-5 w-5" />
    </Link>
  );
}

function ElegirRutina({ rutinas, onIniciar, iniciando }) {
  const [primera, ...resto] = rutinas;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <BotonVolver />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Entrenar</h1>
          <p className="text-sm text-neutral-400">Elige qué vas a entrenar hoy</p>
        </div>
      </header>

      {!primera ? (
        <div className="space-y-3 rounded-3xl border border-dashed border-neutral-700 p-6 text-center">
          <p className="font-bold">Necesitas una rutina para empezar</p>
          <Link to="/rutinas/nueva" className="inline-flex h-12 items-center rounded-full bg-primario px-5 font-extrabold text-fondo">
            Crear rutina
          </Link>
        </div>
      ) : (
        <>
          <article className="space-y-4 rounded-[28px] bg-primario p-5 text-fondo">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider">Siguiente</span>
              <h2 className="text-[28px] font-extrabold leading-tight tracking-tight">{primera.nombre}</h2>
              <p className="font-mono text-sm font-bold">
                {plural(primera.totalEjercicios, 'ejercicio')} · {plural(primera.totalSeries, 'serie')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onIniciar(primera.id)}
              disabled={iniciando}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-fondo px-5 font-extrabold text-primario disabled:opacity-60"
            >
              <Icono nombre="play" className="h-4 w-4" />
              {iniciando ? 'Iniciando…' : 'Empezar'}
            </button>
          </article>

          {resto.map((r) => (
            <article key={r.id} className="flex items-center gap-3 rounded-3xl bg-superficie p-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold">{r.nombre}</h2>
                <p className="font-mono text-xs text-neutral-400">
                  {plural(r.totalEjercicios, 'ejercicio')} · {plural(r.totalSeries, 'serie')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onIniciar(r.id)}
                disabled={iniciando}
                aria-label={`Empezar ${r.nombre}`}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-elevado text-primario transition hover:bg-neutral-700 disabled:opacity-60"
              >
                <Icono nombre="play" className="h-4 w-4" />
              </button>
            </article>
          ))}
        </>
      )}
    </div>
  );
}

function TarjetaEjercicio({ objetivo, series, unidad }) {
  const trabajo = series.filter((s) => !s.esCalentamiento).length;
  const completo = trabajo >= objetivo.series;

  return (
    <article className="space-y-3 rounded-3xl bg-superficie p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold">{objetivo.nombre}</h2>
          <p className="font-mono text-xs text-neutral-400">
            {objetivo.series} × {objetivo.repsMin}–{objetivo.repsMax} · RIR {objetivo.rir}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-bold
            ${completo ? 'bg-primario text-fondo' : 'bg-elevado text-neutral-300'}`}
        >
          {trabajo}/{objetivo.series}
        </span>
      </div>

      {series.length > 0 && (
        <table className="w-full text-left font-mono text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-neutral-400">
              <th scope="col" className="w-8 pb-1 font-bold">#</th>
              <th scope="col" className="pb-1 font-bold">{unidad}</th>
              <th scope="col" className="pb-1 font-bold">Reps</th>
              <th scope="col" className="pb-1 font-bold">RIR</th>
              <th scope="col" className="w-8 pb-1"><span className="sr-only">Efectiva</span></th>
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id} className={s.esCalentamiento ? 'text-neutral-500' : ''}>
                <td className="py-1.5">{s.esCalentamiento ? 'C' : s.numero}</td>
                <td className="py-1.5">{s.peso}</td>
                <td className="py-1.5">{s.reps}</td>
                <td className="py-1.5">{s.rir ?? '—'}</td>
                <td className="py-1.5">
                  {s.esEfectiva && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primario text-fondo">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor"
                           strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                      <span className="sr-only">Serie efectiva</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}

const NIVELES_FATIGA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Entrenar() {
  const navigate = useNavigate();

  const [sesion, setSesion] = useState(undefined);
  const [rutinas, setRutinas] = useState([]);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [hoja, setHoja] = useState(null);
  const [fatiga, setFatiga] = useState(7);

  useEffect(() => {
    let activo = true;
    Promise.all([api('/sesiones/activa'), api('/rutinas')])
      .then(([activa, lista]) => {
        if (!activo) return;
        setSesion(activa);
        setRutinas(lista);
      })
      .catch((err) => {
        if (!activo) return;
        setError(err.message);
        setSesion(null);
      });
    return () => {
      activo = false;
    };
  }, []);

  async function iniciar(rutinaId) {
    setError('');
    setOcupado(true);
    try {
      setSesion(await api('/sesiones', { method: 'POST', body: { rutinaId } }));
    } catch (err) {
      if (err.status === 409) {
        setSesion(await api('/sesiones/activa'));
      } else {
        setError(err.message);
      }
    } finally {
      setOcupado(false);
    }
  }

  async function finalizar() {
    setError('');
    setOcupado(true);
    try {
      await api(`/sesiones/${sesion.id}/finalizar`, { method: 'POST', body: { fatigaPercibida: fatiga } });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setHoja(null);
      setOcupado(false);
    }
  }

  async function cancelar() {
    setError('');
    setOcupado(true);
    try {
      await api(`/sesiones/${sesion.id}`, { method: 'DELETE' });
      setSesion(null);
      setHoja(null);
    } catch (err) {
      setError(err.message);
      setHoja(null);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-[calc(1rem+env(safe-area-inset-top))]">
      {error && <div className="mb-4"><Aviso>{error}</Aviso></div>}

      {sesion === undefined ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : sesion === null ? (
        <ElegirRutina rutinas={rutinas} onIniciar={iniciar} iniciando={ocupado} />
      ) : (
        <SesionEnCurso
          sesion={sesion}
          onFinalizar={() => setHoja('finalizar')}
          onCancelar={() => setHoja('cancelar')}
        />
      )}

      {hoja === 'finalizar' && (
        <HojaInferior titulo="¿Terminaste tu entrenamiento?" onCerrar={() => setHoja(null)}>
          <fieldset className="space-y-2">
            <legend className="text-sm text-neutral-400">
              ¿Qué tan cansado terminaste? <span className="text-neutral-300">1 = muy fácil · 10 = al límite</span>
            </legend>
            <div className="grid grid-cols-5 gap-2">
              {NIVELES_FATIGA.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={fatiga === n}
                  onClick={() => setFatiga(n)}
                  className={`h-12 rounded-full font-mono font-bold transition
                    ${fatiga === n ? 'bg-primario text-fondo' : 'bg-elevado text-neutral-50 hover:bg-neutral-700'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Boton variante="secundario" onClick={() => setHoja(null)} disabled={ocupado}>Seguir</Boton>
            <Boton onClick={finalizar} cargando={ocupado}>Finalizar</Boton>
          </div>
        </HojaInferior>
      )}

      {hoja === 'cancelar' && (
        <HojaInferior titulo="¿Cancelar el entrenamiento?" onCerrar={() => setHoja(null)}>
          <p className="text-sm text-neutral-300">
            Se borrarán las series que registraste en esta sesión. No se puede deshacer.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Boton variante="secundario" onClick={() => setHoja(null)} disabled={ocupado}>Volver</Boton>
            <Boton variante="peligro" onClick={cancelar} cargando={ocupado}>Sí, cancelar</Boton>
          </div>
        </HojaInferior>
      )}
    </div>
  );
}

function SesionEnCurso({ sesion, onFinalizar, onCancelar }) {
  const seriesDe = (ejercicioId) =>
    sesion.ejercicios.find((e) => e.ejercicioId === ejercicioId)?.series ?? [];
  const totalSeries = sesion.ejercicios.reduce((total, e) => total + e.series.length, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <BotonVolver />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold">{sesion.rutina ?? 'Sesión libre'}</h1>
          <p className="font-mono text-xs text-neutral-400">
            <Cronometro segundosIniciales={sesion.segundosTranscurridos ?? 0} /> · {plural(totalSeries, 'serie')}
          </p>
        </div>
        <button
          type="button"
          onClick={onFinalizar}
          className="h-11 rounded-full bg-elevado px-4 text-sm font-bold transition hover:bg-neutral-700"
        >
          Finalizar
        </button>
      </header>

      {sesion.plan.map((objetivo) => (
        <TarjetaEjercicio
          key={objetivo.ejercicioId}
          objetivo={objetivo}
          series={seriesDe(objetivo.ejercicioId)}
          unidad={sesion.unidad}
        />
      ))}

      <button
        type="button"
        onClick={onCancelar}
        className="h-12 w-full rounded-full text-sm font-semibold text-red-300 transition hover:bg-peligro/10"
      >
        Cancelar entrenamiento
      </button>
    </div>
  );
}