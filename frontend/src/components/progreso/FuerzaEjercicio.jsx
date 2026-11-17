import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../services/api';
import { formatoDiaMes, formatoDiaMesAnio } from '../../utils/fechas';
import { plural } from '../../utils/formato';
import Icono from '../ui/Icono';
import NumeroAnimado from '../ui/NumeroAnimado';

const PERIODOS = [
  { dias: 30, etiqueta: '1M' },
  { dias: 90, etiqueta: '3M' },
  { dias: 180, etiqueta: '6M' },
  { dias: 365, etiqueta: '1A' },
  { dias: 0, etiqueta: 'Todo' }
];

const COLOR = {
  serie: '#D4FF3F',
  superficie: '#161616',
  rejilla: '#2A2A2A',
  ejes: '#A3A3A3',
  cursor: '#6B6B6B'
};

const decimal = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

function ContenidoTooltip({ active, payload, unidad }) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className="rounded-2xl border border-borde bg-fondo px-3 py-2 shadow-lg shadow-black/60">
      <p className="font-mono text-base font-bold text-neutral-50">
        {decimal.format(punto.e1rm)} {unidad}
      </p>
      <p className="text-xs text-neutral-400">{formatoDiaMesAnio(punto.fecha)}</p>
      <p className="mt-1 font-mono text-xs text-neutral-300">
        Mejor serie: {decimal.format(punto.peso)} × {punto.reps}
      </p>
    </div>
  );
}

function Resumen({ puntos, unidad }) {
  const actual = puntos.at(-1).e1rm;
  const inicial = puntos[0].e1rm;
  const record = Math.max(...puntos.map((p) => p.e1rm));
  const cambio = actual - inicial;
  const porcentaje = inicial > 0 ? (cambio / inicial) * 100 : 0;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm text-neutral-400">1RM estimado actual</p>
        <p className="font-mono text-4xl font-bold leading-none">
          <NumeroAnimado valor={actual} formato={decimal.format} /> <span className="text-base text-neutral-400">{unidad}</span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {puntos.length > 1 && (
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-xs font-bold
              ${cambio >= 0 ? 'bg-primario text-fondo' : 'bg-elevado text-neutral-300'}`}
          >
            {cambio >= 0 ? '+' : ''}{decimal.format(cambio)} {unidad} ({cambio >= 0 ? '+' : ''}{decimal.format(porcentaje)}%)
          </span>
        )}
        <span className="font-mono text-xs text-neutral-400">Récord: {decimal.format(record)} {unidad}</span>
      </div>
    </div>
  );
}

export default function FuerzaEjercicio() {
  const idSelector = useId();
  const [ejercicios, setEjercicios] = useState(null);
  const [elegido, setElegido] = useState(null);
  const [dias, setDias] = useState(90);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  const ejercicioId = elegido ?? ejercicios?.[0]?.id ?? null;

  useEffect(() => {
    api('/progreso/ejercicios')
      .then(setEjercicios)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!ejercicioId) return;
    let activo = true;
    api(`/progreso/fuerza/${ejercicioId}?dias=${dias}`)
      .then((respuesta) => {
        if (activo) setDatos(respuesta);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, [ejercicioId, dias]);

  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (!ejercicios) return <p className="text-neutral-400">Cargando…</p>;

  if (ejercicios.length === 0) {
    return (
      <div className="space-y-2 rounded-3xl border border-dashed border-neutral-700 p-6 text-center">
        <p className="font-bold">Todavía no hay datos de fuerza</p>
        <p className="text-sm text-neutral-400">
          Termina tu primer entrenamiento y aquí verás cómo evoluciona tu 1RM estimado en cada ejercicio.
          Los ejercicios con peso corporal aparecen cuando les agregas lastre.
        </p>
      </div>
    );
  }

  const actualizado = datos?.ejercicioId === ejercicioId && datos?.dias === dias;
  const puntos = datos?.puntos ?? [];
  const unidad = datos?.unidad ?? '';

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label htmlFor={idSelector} className="sr-only">Ejercicio</label>
        <div className="relative">
          <select
            id={idSelector}
            value={ejercicioId}
            onChange={(e) => setElegido(Number(e.target.value))}
            className="h-12 w-full appearance-none rounded-full border border-borde bg-superficie pl-4 pr-10 text-base font-bold
                       outline-none focus:border-primario focus:ring-2 focus:ring-primario/25"
          >
            {ejercicios.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} ({plural(e.sesiones, 'sesión', 'sesiones')})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
            <Icono nombre="abajo" className="h-5 w-5" />
          </span>
        </div>

        <div role="group" aria-label="Periodo" className="grid grid-cols-5 gap-1 rounded-full bg-superficie p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              type="button"
              aria-pressed={dias === p.dias}
              onClick={() => setDias(p.dias)}
              className={`h-9 rounded-full font-mono text-sm font-bold transition
                ${dias === p.dias ? 'bg-primario text-fondo' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {!datos ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : (
        <div className={`space-y-4 transition-opacity ${actualizado ? '' : 'opacity-50'}`}>
          {puntos.length === 0 ? (
            <p className="rounded-3xl bg-superficie px-4 py-6 text-center text-sm text-neutral-300">
              No entrenaste {datos.nombre} en este periodo. Prueba con un periodo más largo.
            </p>
          ) : (
            <>
              <section className="space-y-4 rounded-[28px] bg-superficie p-5">
                <Resumen puntos={puntos} unidad={unidad} />

                <figure className="-mx-2 h-56" aria-label={`Evolución del 1RM estimado en ${datos.nombre}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={puntos} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke={COLOR.rejilla} />
                      <XAxis
                        dataKey="fecha"
                        tickFormatter={formatoDiaMes}
                        tick={{ fill: COLOR.ejes, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        domain={[
                          (minimo) => Math.max(0, Math.floor((minimo - 2) / 5) * 5),
                          (maximo) => Math.ceil((maximo + 2) / 5) * 5
                        ]}
                        tickCount={5}
                        tickFormatter={(v) => decimal.format(v)}
                        tick={{ fill: COLOR.ejes, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        allowDecimals={false}
                      />
                      <Tooltip
                        content={<ContenidoTooltip unidad={unidad} />}
                        cursor={{ stroke: COLOR.cursor, strokeWidth: 1 }}
                      />
                      <Line
                        type="linear"
                        dataKey="e1rm"
                        stroke={COLOR.serie}
                        strokeWidth={2}
                        dot={{ r: 4, fill: COLOR.serie, stroke: COLOR.superficie, strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: COLOR.serie, stroke: COLOR.superficie, strokeWidth: 2 }}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </figure>

                {puntos.length === 1 && (
                  <p className="text-xs text-neutral-400">
                    Con una sola sesión todavía no hay tendencia: vuelve después de tu próximo entrenamiento.
                  </p>
                )}
                <p className="text-xs text-neutral-400">
                  Cada punto es tu mejor serie de la sesión, convertida a 1RM con la fórmula de Epley.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-neutral-400">Sesiones del periodo</h3>
                <ul className="escalonado space-y-2">
                  {[...puntos].reverse().map((p) => (
                    <li key={p.sesionId}>
                      <Link
                        to={`/historial/${p.sesionId}`}
                        className="flex items-center gap-3 rounded-3xl bg-superficie px-4 py-3 transition hover:bg-elevado"
                      >
                        <span className="w-20 shrink-0 text-sm text-neutral-400">{formatoDiaMes(p.fecha)}</span>
                        <span className="flex-1 font-mono text-sm">
                          {decimal.format(p.peso)} × {p.reps}
                        </span>
                        <span className="font-mono text-sm font-bold">
                          {decimal.format(p.e1rm)} <span className="text-neutral-400">{unidad}</span>
                        </span>
                        <Icono nombre="flecha" className="h-4 w-4 shrink-0 text-neutral-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}