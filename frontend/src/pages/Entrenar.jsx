import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { plural } from '../utils/formato';
import Boton from '../components/ui/Boton';
import Icono from '../components/ui/Icono';
import PortadaRutina from '../components/PortadaRutina';
import HojaInferior from '../components/ui/HojaInferior';
import Cronometro from '../components/Cronometro';
import FormularioSerie from '../components/FormularioSerie';
import RecordatorioSuplementos from '../components/RecordatorioSuplementos';
import TemporizadorDescanso from '../components/TemporizadorDescanso';
import { prepararAviso, sonarAviso } from '../utils/aviso';
import { guardarDescanso, leerDescanso } from '../utils/descanso';

const seriesDe = (sesion, ejercicioId) =>
  sesion.ejercicios.find((e) => e.ejercicioId === ejercicioId)?.series ?? [];

const trabajoDe = (sesion, ejercicioId) =>
  seriesDe(sesion, ejercicioId).filter((s) => !s.esCalentamiento).length;

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
          <Link to="/rutinas/nueva" className="inline-flex h-12 items-center rounded-full bg-primario px-5 font-extrabold text-sobre-primario">
            Crear rutina
          </Link>
        </div>
      ) : (
        <>
          <PortadaRutina
            rutina={primera}
            className="flex min-h-60 flex-col justify-end gap-4 rounded-[28px] p-5 text-white"
          >
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-primario">Siguiente</span>
              <h2 className="text-[28px] font-extrabold leading-tight tracking-tight">{primera.nombre}</h2>
              <p className="font-mono text-sm text-white/75">
                {plural(primera.totalEjercicios, 'ejercicio')} · {plural(primera.totalSeries, 'serie')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onIniciar(primera.id)}
              disabled={iniciando}
              className="inline-flex h-12 items-center gap-2 self-start rounded-full bg-primario px-5 font-extrabold text-sobre-primario
                         transition hover:bg-primario-claro disabled:opacity-60"
            >
              <Icono nombre="play" className="h-4 w-4" />
              {iniciando ? 'Iniciando…' : 'Empezar'}
            </button>
          </PortadaRutina>

          {resto.map((r) => (
            <article key={r.id} className="flex items-center gap-3 rounded-3xl bg-superficie p-3 pr-4">
              <PortadaRutina rutina={r} ancho={200} oscurecer={false} className="h-14 w-14 shrink-0 rounded-2xl" />
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

const ETIQUETAS_SUGERENCIA = {
  inicial: 'Primera vez',
  subir: 'Sube el peso',
  mantener: 'Mantén el peso',
  bajar: 'Baja el peso'
};

function Sugerencia({ sugerencia, objetivo }) {
  const meta = sugerencia.peso === null
    ? `${objetivo.repsMin}–${objetivo.repsMax} reps`
    : `${sugerencia.peso} ${sugerencia.unidad} × ${sugerencia.reps}`;

  return (
    <div className="space-y-2">
      <div className="rounded-2xl bg-primario/10 p-3">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primario">
            {ETIQUETAS_SUGERENCIA[sugerencia.tipo]}
          </span>
          <span className="font-mono text-base font-bold text-neutral-50">{meta}</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-neutral-300">{sugerencia.mensaje}</p>
      </div>
      {sugerencia.estancado && (
        <p className="rounded-2xl bg-alerta/10 p-3 text-xs leading-relaxed text-amber-200">
          <span className="font-bold">Posible estancamiento:</span> tu 1RM estimado no ha mejorado en las
          últimas 3 sesiones. Considera una semana de descarga o revisar tu descanso y sueño.
        </p>
      )}
    </div>
  );
}

function TarjetaEjercicio({ objetivo, series, unidad, activo, onActivar, onBorrar, children }) {
  const trabajo = series.filter((s) => !s.esCalentamiento).length;
  const completo = trabajo >= objetivo.series;

  return (
    <article className={`space-y-3 rounded-3xl bg-superficie p-4 ${activo ? 'ring-1 ring-primario/50' : ''}`}>
      <button
        type="button"
        onClick={onActivar}
        aria-expanded={activo}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-lg font-extrabold">{objetivo.nombre}</span>
          <span className="block font-mono text-xs text-neutral-400">
            {objetivo.series} × {objetivo.repsMin}–{objetivo.repsMax} · RIR {objetivo.rir}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-bold
            ${completo ? 'bg-primario text-sobre-primario' : 'bg-elevado text-neutral-300'}`}
        >
          {trabajo}/{objetivo.series}
        </span>
      </button>

      {activo && objetivo.sugerencia && <Sugerencia sugerencia={objetivo.sugerencia} objetivo={objetivo} />}

      {series.length > 0 && (
        <table className="w-full text-left font-mono text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-neutral-400">
              <th scope="col" className="w-8 pb-1 font-bold">#</th>
              <th scope="col" className="pb-1 font-bold">{unidad}</th>
              <th scope="col" className="pb-1 font-bold">Reps</th>
              <th scope="col" className="pb-1 font-bold">RIR</th>
              <th scope="col" className="w-8 pb-1"><span className="sr-only">Efectiva</span></th>
              {activo && <th scope="col" className="w-8 pb-1"><span className="sr-only">Borrar</span></th>}
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
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primario text-sobre-primario">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor"
                           strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                      <span className="sr-only">Serie efectiva</span>
                    </span>
                  )}
                </td>
                {activo && (
                  <td className="py-1.5">
                    <button
                      type="button"
                      onClick={() => onBorrar(s.id)}
                      aria-label={`Borrar serie ${s.esCalentamiento ? 'de calentamiento' : s.numero}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-peligro/15 hover:text-red-300"
                    >
                      <Icono nombre="cerrar" className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {children}
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
  const [suplementosAntes, setSuplementosAntes] = useState([]);
  const [suplementosDespues, setSuplementosDespues] = useState([]);

  const sesionId = sesion?.id;

  // Al haber un entrenamiento en curso, recordar lo que se toma ANTES de entrenar
  useEffect(() => {
    if (!sesionId) return;
    let activo = true;
    api('/suplementos')
      .then((datos) => {
        if (activo) {
          setSuplementosAntes(datos.suplementos.filter((x) => x.pendienteHoy && x.momento === 'AntesEntrenar'));
        }
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [sesionId]);

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

  async function registrarSerie(datos) {
    await api(`/sesiones/${sesion.id}/series`, { method: 'POST', body: datos });
    const actualizada = await api(`/sesiones/${sesion.id}`);
    setSesion(actualizada);
    return actualizada;
  }

  async function borrarSerie(serieId) {
    setError('');
    try {
      await api(`/sesiones/${sesion.id}/series/${serieId}`, { method: 'DELETE' });
      setSesion(await api(`/sesiones/${sesion.id}`));
    } catch (err) {
      setError(err.message);
    }
  }

  async function finalizar() {
    setError('');
    setOcupado(true);
    try {
      await api(`/sesiones/${sesion.id}/finalizar`, { method: 'POST', body: { fatigaPercibida: fatiga } });
      guardarDescanso(sesion.id, null);

      // Recordar lo que va DESPUÉS de entrenar (o lo diario que aún no tomas)
      const datos = await api('/suplementos').catch(() => null);
      const despues = datos?.suplementos.filter((x) => x.pendienteHoy && x.momento !== 'AntesEntrenar') ?? [];
      if (despues.length > 0) {
        setSuplementosDespues(despues);
        setHoja('suplementos');
      } else {
        navigate('/', { replace: true });
      }
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
      guardarDescanso(sesion.id, null);
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
    <div className="animate-pagina mx-auto min-h-dvh max-w-md px-4 pb-10 pt-[calc(1rem+env(safe-area-inset-top))]">
      {error && <div className="mb-4"><Aviso>{error}</Aviso></div>}

      {sesion && suplementosAntes.length > 0 && (
        <section className="mb-4 space-y-2" aria-label="Antes de empezar">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-amber-200">Antes de empezar</h2>
            <button
              type="button"
              onClick={() => setSuplementosAntes([])}
              className="h-9 rounded-full px-3 text-xs font-semibold text-neutral-400 hover:text-neutral-100"
            >
              Ocultar
            </button>
          </div>
          <RecordatorioSuplementos suplementos={suplementosAntes} onCambio={setSuplementosAntes} />
        </section>
      )}

      {sesion === undefined ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : sesion === null ? (
        <ElegirRutina rutinas={rutinas} onIniciar={iniciar} iniciando={ocupado} />
      ) : (
        <SesionEnCurso
          sesion={sesion}
          onRegistrar={registrarSerie}
          onBorrar={borrarSerie}
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
                    ${fatiga === n ? 'bg-primario text-sobre-primario' : 'bg-elevado text-neutral-50 hover:bg-neutral-700'}`}
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

      {hoja === 'suplementos' && (
        <HojaInferior titulo="¡Buen entrenamiento!" onCerrar={() => navigate('/', { replace: true })}>
          <p className="text-sm text-neutral-300">
            {suplementosDespues.length > 0 ? 'No olvides tus suplementos de hoy:' : '¡Listo, ya quedó todo registrado!'}
          </p>
          <RecordatorioSuplementos suplementos={suplementosDespues} onCambio={setSuplementosDespues} fondo="bg-elevado" />
          <Boton onClick={() => navigate('/', { replace: true })} className="w-full">
            {suplementosDespues.length > 0 ? 'Después' : 'Ir al inicio'}
          </Boton>
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

function SesionEnCurso({ sesion, onRegistrar, onBorrar, onFinalizar, onCancelar }) {
  const [elegidoId, setElegidoId] = useState(null);
  const [descanso, setDescanso] = useState(() => leerDescanso(sesion.id));

  useEffect(() => {
    guardarDescanso(sesion.id, descanso);
  }, [sesion.id, descanso]);

  const terminarDescanso = useCallback(() => {
    sonarAviso();
    setDescanso(null);
  }, []);

  const pendiente = sesion.plan.find((p) => trabajoDe(sesion, p.ejercicioId) < p.series);
  const activoId = elegidoId ?? pendiente?.ejercicioId ?? null;
  const totalSeries = sesion.ejercicios.reduce((total, e) => total + e.series.length, 0);

  async function registrar(datos) {
    prepararAviso();
    const actualizada = await onRegistrar(datos);
    const objetivo = actualizada.plan.find((p) => p.ejercicioId === datos.ejercicioId);
    const terminoEjercicio = trabajoDe(actualizada, datos.ejercicioId) >= objetivo.series;
    if (terminoEjercicio) setElegidoId(null);

    const proximo = terminoEjercicio
      ? actualizada.plan.find((p) => trabajoDe(actualizada, p.ejercicioId) < p.series)
      : objetivo;

    if (!datos.esCalentamiento && proximo) {
      setDescanso({
        finEn: Date.now() + objetivo.descansoSeg * 1000,
        total: objetivo.descansoSeg,
        siguiente: `${proximo.nombre} · serie ${trabajoDe(actualizada, proximo.ejercicioId) + 1}`
      });
    }
  }

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
          className={`h-11 rounded-full px-4 text-sm font-bold transition
            ${pendiente ? 'bg-elevado hover:bg-neutral-700' : 'bg-primario text-sobre-primario hover:bg-primario-claro'}`}
        >
          Finalizar
        </button>
      </header>

      {descanso && (
        <TemporizadorDescanso
          key={descanso.finEn - descanso.total * 1000}
          finEn={descanso.finEn}
          total={descanso.total}
          siguiente={descanso.siguiente}
          onSumar={() => setDescanso((d) => ({ ...d, finEn: d.finEn + 30000, total: d.total + 30 }))}
          onSaltar={() => setDescanso(null)}
          onTerminar={terminarDescanso}
        />
      )}

      {!pendiente && (
        <p className="rounded-3xl bg-primario/10 px-4 py-3 text-sm font-semibold text-primario">
          ¡Completaste todas las series de la rutina! Toca Finalizar cuando termines.
        </p>
      )}

      {sesion.plan.map((objetivo) => {
        const series = seriesDe(sesion, objetivo.ejercicioId);
        const activo = objetivo.ejercicioId === activoId;
        const trabajo = series.filter((s) => !s.esCalentamiento);

        return (
          <TarjetaEjercicio
            key={objetivo.ejercicioId}
            objetivo={objetivo}
            series={series}
            unidad={sesion.unidad}
            activo={activo}
            onActivar={() => setElegidoId(activo ? -1 : objetivo.ejercicioId)}
            onBorrar={onBorrar}
          >
            {activo && (
              <FormularioSerie
                key={objetivo.ejercicioId}
                objetivo={objetivo}
                ultimaSerie={trabajo.at(-1)}
                unidadUsuario={sesion.unidad}
                numeroSiguiente={trabajo.length + 1}
                onRegistrar={registrar}
              />
            )}
          </TarjetaEjercicio>
        );
      })}

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