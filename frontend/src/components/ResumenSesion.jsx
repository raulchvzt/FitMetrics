import { useEffect, useMemo, useState } from 'react';
import Icono from './ui/Icono';
import NumeroAnimado from './ui/NumeroAnimado';
import MapaMuscular from './MapaMuscular';
import RecordatorioSuplementos from './RecordatorioSuplementos';
import { formatoDuracion, formatoNumero, plural } from '../utils/formato';
import { COLOR, formatoSeries } from '../utils/mapaMuscular';

const COLORES_CONFETI = ['var(--color-primario)', '#FFFFFF', 'var(--color-alerta)', 'var(--color-primario-claro)'];

// Confeti hecho con CSS: cada pieza cae con su propia posición, giro y retraso
function Confeti() {
  // Se calculan una sola vez para que no cambien en cada render
  const [piezas] = useState(() => Array.from({ length: 42 }, (_, i) => ({
    izquierda: Math.random() * 100,
    retraso: Math.random() * 0.6,
    duracion: 1.8 + Math.random() * 1.4,
    giro: (Math.random() - 0.5) * 900,
    deriva: (Math.random() - 0.5) * 120,
    ancho: 6 + Math.random() * 6,
    color: COLORES_CONFETI[i % COLORES_CONFETI.length],
    redonda: i % 3 === 0
  })));

  return (
    <div aria-hidden="true" className="confeti pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {piezas.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.izquierda}%`,
            width: p.ancho,
            height: p.redonda ? p.ancho : p.ancho * 1.6,
            background: p.color,
            borderRadius: p.redonda ? '50%' : 2,
            animationDelay: `${p.retraso}s`,
            animationDuration: `${p.duracion}s`,
            '--giro': `${p.giro}deg`,
            '--deriva': `${p.deriva}px`
          }}
        />
      ))}
    </div>
  );
}

function Dato({ etiqueta, children }) {
  return (
    <div className="rounded-3xl bg-superficie p-3.5">
      <p className="text-xs text-neutral-400">{etiqueta}</p>
      <p className="mt-1 font-mono text-2xl font-bold leading-none">{children}</p>
    </div>
  );
}

function colorPorSeries(series) {
  if (series >= 3) return COLOR.enRango;
  if (series > 0) return COLOR.bajo;
  return COLOR.vacio;
}

/**
 * Pantalla que aparece al finalizar un entrenamiento.
 * sesion: respuesta de POST /sesiones/:id/finalizar (con records y musculos)
 */
export default function ResumenSesion({ sesion, suplementos, onSuplementos, onListo }) {
  const { records = [], musculos = [], unidad } = sesion;

  const totales = useMemo(() => {
    const series = sesion.ejercicios.flatMap((e) => e.series);
    return {
      volumen: series.filter((s) => !s.esCalentamiento).reduce((t, s) => t + s.peso * s.reps, 0),
      efectivas: series.filter((s) => s.esEfectiva).length
    };
  }, [sesion]);

  const colores = Object.fromEntries(musculos.map((m) => [m.nombre, colorPorSeries(m.series)]));
  const principales = [...musculos].sort((a, b) => b.series - a.series).slice(0, 4);
  const hayRecords = records.length > 0;

  useEffect(() => {
    // Vibra al celebrar un récord (Android; el iPhone no lo permite desde la web)
    if (hayRecords) navigator.vibrate?.([30, 60, 30]);
  }, [hayRecords]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-resumen"
      className="fixed inset-0 z-40 overflow-y-auto bg-fondo"
    >
      {hayRecords && <Confeti />}

      <div className="escalonado mx-auto max-w-md space-y-3 px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
        <header className="pb-2 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primario text-sobre-primario shadow-[0_0_48px_-6px] shadow-primario/60">
            <Icono nombre={hayRecords ? 'trofeo' : 'entrenar'} className="h-8 w-8" />
          </span>
          <p className="text-sm font-bold uppercase tracking-wider text-primario">Entrenamiento terminado</p>
          <h1 id="titulo-resumen" className="mt-1 text-3xl font-extrabold tracking-tight">
            {sesion.rutina ?? 'Sesión libre'}
          </h1>
        </header>

        <section className="grid grid-cols-3 gap-2" aria-label="Totales">
          <Dato etiqueta="Duración">{formatoDuracion(sesion.segundosTranscurridos)}</Dato>
          <Dato etiqueta={`Volumen (${unidad})`}>
            <NumeroAnimado valor={totales.volumen} formato={(v) => formatoNumero(v)} duracion={1100} />
          </Dato>
          <Dato etiqueta="Series efectivas">
            <NumeroAnimado valor={totales.efectivas} duracion={900} />
          </Dato>
        </section>

        {hayRecords ? (
          <section className="rounded-3xl bg-primario/10 p-4 ring-1 ring-primario/30" aria-labelledby="titulo-records">
            <h2 id="titulo-records" className="flex items-center gap-2 font-extrabold">
              <Icono nombre="trofeo" className="h-5 w-5 text-primario" />
              {records.length === 1 ? '¡Récord nuevo!' : `¡${records.length} récords nuevos!`}
            </h2>
            <ul className="mt-3 space-y-2">
              {records.map((r) => (
                <li key={r.ejercicioId} className="flex items-center gap-3 rounded-2xl bg-superficie p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{r.nombre}</p>
                    <p className="font-mono text-xs text-neutral-400">1RM est. {formatoNumero(r.e1rm)} {unidad}</p>
                  </div>
                  <span className="rounded-full bg-primario px-2.5 py-1 font-mono text-xs font-bold text-sobre-primario">
                    +{r.mejora.toFixed(1)} {unidad}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="rounded-3xl bg-superficie px-4 py-3 text-sm text-neutral-300">
            Hoy no hubo récord de fuerza, pero cada serie efectiva suma a tu progreso.
          </p>
        )}

        {musculos.length > 0 && (
          <section className="rounded-3xl bg-superficie p-4" aria-labelledby="titulo-musculos">
            <h2 id="titulo-musculos" className="font-extrabold">Músculos trabajados</h2>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex shrink-0 gap-1" aria-hidden="true">
                <MapaMuscular vista="frente" colores={colores} className="h-36 w-auto" />
                <MapaMuscular vista="espalda" colores={colores} className="h-36 w-auto" />
              </div>
              <ul className="min-w-0 flex-1 space-y-2">
                {principales.map((m) => (
                  <li key={m.nombre} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorPorSeries(m.series) }} />
                    <span className="min-w-0 flex-1 truncate">{m.nombre}</span>
                    <span className="font-mono text-xs text-neutral-400">{formatoSeries(m.series)}</span>
                  </li>
                ))}
                {musculos.length > principales.length && (
                  <li className="text-xs text-neutral-500">y {plural(musculos.length - principales.length, 'más', 'más')}</li>
                )}
              </ul>
            </div>
          </section>
        )}

        {suplementos.length > 0 && (
          <section className="space-y-2" aria-label="Suplementos de después">
            <h2 className="px-1 text-sm font-bold text-amber-200">No olvides tus suplementos</h2>
            <RecordatorioSuplementos suplementos={suplementos} onCambio={onSuplementos} />
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-fondo from-60% to-transparent px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-6">
        <button
          type="button"
          onClick={onListo}
          className="mx-auto flex h-14 w-full max-w-md items-center justify-center gap-2 rounded-full bg-primario font-extrabold text-sobre-primario transition hover:bg-primario-claro"
        >
          Listo
        </button>
      </div>
    </div>
  );
}
