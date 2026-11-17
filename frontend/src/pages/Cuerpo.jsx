import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Icono from '../components/ui/Icono';
import MapaMuscular from '../components/MapaMuscular';
import {
  COLOR, consejo, estadoRecuperacion, estadoVolumen, formatoSeries, textoUltimaVez
} from '../utils/mapaMuscular';

const MODOS = [
  { id: 'recuperacion', etiqueta: 'Recuperación' },
  { id: 'volumen', etiqueta: 'Volumen semanal' }
];

const estadoDe = (m, modo) => (modo === 'volumen' ? estadoVolumen(m) : estadoRecuperacion(m.recuperacion));

function Leyenda({ modo }) {
  const items = modo === 'volumen'
    ? [['vacio', 'Sin series'], ['bajo', 'Por debajo'], ['enRango', 'En rango'], ['exceso', 'Arriba']]
    : [['cansado', 'Cansado'], ['medio', 'Recuperándose'], ['listo', 'Listo']];
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-neutral-400">
      {items.map(([clave, texto]) => (
        <li key={clave} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[clave] }} />
          {texto}
        </li>
      ))}
    </ul>
  );
}

function Detalle({ musculo, modo }) {
  const estado = estadoDe(musculo, modo);
  const rec = estadoRecuperacion(musculo.recuperacion);
  return (
    <section key={musculo.id} aria-live="polite" className="animate-pagina rounded-3xl bg-superficie p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight">{musculo.nombre}</h2>
          <p className="text-sm text-neutral-400">{textoUltimaVez(musculo.ultimaVez)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold
            ${estado.clave === 'vacio' ? 'text-neutral-50' : 'text-sobre-primario'}`}
          style={{ background: COLOR[estado.clave] }}
        >
          {estado.texto}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-elevado p-3">
          <p className="text-xs text-neutral-400">Recuperación</p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {musculo.recuperacion}<span className="text-sm text-neutral-400">%</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-700">
            <div
              className="h-full origin-left animate-crecer-x rounded-full"
              style={{ width: `${musculo.recuperacion}%`, background: COLOR[rec.clave] }}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-elevado p-3">
          <p className="text-xs text-neutral-400">Esta semana</p>
          <p className="mt-1 font-mono text-2xl font-bold">
            {formatoSeries(musculo.series)}
            <span className="text-sm text-neutral-400"> {musculo.series === 1 ? 'serie' : 'series'}</span>
          </p>
          <p className="mt-1.5 font-mono text-xs text-neutral-400">rango {musculo.minimo}–{musculo.maximo}</p>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm text-neutral-300">
        <Icono nombre="avanzar" className="mt-0.5 h-4 w-4 shrink-0 text-primario" />
        {consejo(musculo)}
      </p>
    </section>
  );
}

export default function Cuerpo() {
  const [musculos, setMusculos] = useState(null);
  const [error, setError] = useState('');
  const [modo, setModo] = useState('recuperacion');
  const [elegido, setElegido] = useState(null);

  useEffect(() => {
    api('/progreso/cuerpo')
      .then((datos) => {
        setMusculos(datos.musculos);
        // Empieza mostrando el músculo más cansado
        const masCansado = [...datos.musculos].sort((a, b) => a.recuperacion - b.recuperacion)[0];
        setElegido(masCansado?.nombre ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  const colores = Object.fromEntries((musculos ?? []).map((m) => [m.nombre, COLOR[estadoDe(m, modo).clave]]));
  const musculo = musculos?.find((m) => m.nombre === elegido);
  const sinDatos = musculos?.every((m) => !m.ultimaVez);
  const lista = [...(musculos ?? [])].sort((a, b) =>
    modo === 'volumen' ? a.series / a.minimo - b.series / b.minimo : a.recuperacion - b.recuperacion
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Volver al inicio"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
        >
          <Icono nombre="atras" className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tu cuerpo</h1>
          <p className="text-sm text-neutral-400">Toca un músculo para ver el detalle</p>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div role="group" aria-label="Qué mostrar" className="grid grid-cols-2 gap-1 rounded-full bg-superficie p-1">
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={modo === m.id}
            onClick={() => setModo(m.id)}
            className={`h-10 rounded-full text-sm font-bold transition
              ${modo === m.id ? 'bg-primario text-sobre-primario' : 'text-neutral-300 hover:text-neutral-50'}`}
          >
            {m.etiqueta}
          </button>
        ))}
      </div>

      <section className="rounded-[28px] bg-superficie px-3 pb-4 pt-3">
        <div className="grid grid-cols-2">
          {['frente', 'espalda'].map((vista) => (
            <figure key={vista} className="flex flex-col items-center">
              <MapaMuscular
                vista={vista}
                colores={colores}
                seleccionado={elegido}
                onElegir={musculos ? setElegido : undefined}
                className="h-72 w-auto"
              />
              <figcaption className="mt-1 text-xs font-semibold text-neutral-500">
                {vista === 'frente' ? 'Frente' : 'Espalda'}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-3">
          <Leyenda modo={modo} />
        </div>
      </section>

      {musculos === null && !error && <p className="text-center text-sm text-neutral-400">Cargando…</p>}

      {sinDatos && (
        <p className="rounded-3xl bg-superficie px-4 py-3 text-sm leading-relaxed text-neutral-300">
          Todavía no hay entrenamientos recientes. Cuando registres series, aquí verás qué tan
          recuperado está cada músculo y cuánto llevas en la semana.
        </p>
      )}

      {musculo && !sinDatos && <Detalle musculo={musculo} modo={modo} />}

      {musculos && !sinDatos && (
        <section aria-labelledby="titulo-todos" className="rounded-3xl bg-superficie p-2">
          <h2 id="titulo-todos" className="px-2 pb-1 pt-2 text-sm font-bold text-neutral-400">Todos los músculos</h2>
          <ul>
            {lista.map((m) => {
              const estado = estadoDe(m, modo);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setElegido(m.nombre);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    aria-pressed={elegido === m.nombre}
                    className={`flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-left transition hover:bg-elevado
                      ${elegido === m.nombre ? 'bg-elevado' : ''}`}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR[estado.clave] }} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{m.nombre}</span>
                    <span className="text-xs text-neutral-400">{estado.texto}</span>
                    <span className="w-16 text-right font-mono text-sm">
                      {modo === 'volumen'
                        ? `${formatoSeries(m.series)}/${m.minimo}`
                        : `${m.recuperacion}%`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="px-2 text-center text-xs leading-relaxed text-neutral-500">
        La recuperación es una estimación con tus series efectivas, su RIR y el tiempo que
        tarda cada músculo. Escucha a tu cuerpo.
      </p>
    </div>
  );
}
