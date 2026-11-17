import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { formatoDiaMes, sumarDias } from '../../utils/fechas';

const decimal = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
function rangoSemana(inicio, fin) {
  return `${formatoDiaMes(inicio)} – ${formatoDiaMes(fin)}`;
}

const ESTADOS = {
  bajo: { barra: 'bg-alerta', texto: 'text-alerta', etiqueta: 'Por debajo' },
  optimo: { barra: 'bg-primario', texto: 'text-neutral-50', etiqueta: 'En rango' },
  alto: { barra: 'bg-red-400', texto: 'text-red-300', etiqueta: 'Por encima' }
};

function estadoDe({ series, minimo, maximo }) {
  if (series < minimo) return 'bajo';
  if (series > maximo) return 'alto';
  return 'optimo';
}

function BarraMusculo({ musculo, escala }) {
  const estado = ESTADOS[estadoDe(musculo)];
  const porcentaje = (valor) => `${Math.min(100, (valor / escala) * 100)}%`;

  return (
    <li className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm text-neutral-300">{musculo.musculo}</span>
      <div
        className="relative h-3.5 flex-1 rounded-full bg-fondo"
        role="img"
        aria-label={`${musculo.musculo}: ${decimal.format(musculo.series)} series efectivas, rango ${musculo.minimo} a ${musculo.maximo}. ${estado.etiqueta}.`}
      >
        <div
          className="absolute inset-y-0 bg-neutral-800"
          style={{ left: porcentaje(musculo.minimo), width: `calc(${porcentaje(musculo.maximo)} - ${porcentaje(musculo.minimo)})` }}
        />
        {musculo.series > 0 && (
          <div
            className={`absolute inset-y-[3px] left-0 rounded-full ${estado.barra}`}
            style={{ width: porcentaje(musculo.series) }}
          />
        )}
      </div>
      <span className={`w-9 shrink-0 text-right font-mono text-sm font-bold ${estado.texto}`}>
        {decimal.format(musculo.series)}
      </span>
    </li>
  );
}

export default function VolumenSemanal() {
  const [semana, setSemana] = useState(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    api(`/progreso/volumen${semana ? `?semana=${semana}` : ''}`)
      .then((respuesta) => {
        if (activo) setDatos(respuesta);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, [semana]);

  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (!datos) return <p className="text-neutral-400">Cargando…</p>;

  const total = datos.musculos.reduce((suma, m) => suma + m.series, 0);
  const anterior = datos.musculos.reduce((suma, m) => suma + m.seriesAnterior, 0);
  const diferencia = total - anterior;
  const escala = Math.max(...datos.musculos.map((m) => Math.max(m.series, m.maximo))) * 1.1;
  const cortos = datos.musculos.filter((m) => estadoDe(m) === 'bajo' && m.series > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Series efectivas</h2>
        <div className="flex items-center gap-1 rounded-full bg-superficie p-1">
          <button
            type="button"
            onClick={() => setSemana(sumarDias(datos.inicio, -7))}
            aria-label="Semana anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-elevado text-lg transition hover:bg-neutral-700"
          >
            ‹
          </button>
          <span className="px-1.5 font-mono text-xs font-bold" aria-live="polite">
            {rangoSemana(datos.inicio, datos.fin)}
          </span>
          <button
            type="button"
            onClick={() => setSemana(sumarDias(datos.inicio, 7))}
            disabled={datos.esSemanaActual}
            aria-label="Semana siguiente"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-elevado text-lg transition hover:bg-neutral-700 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      <section className="space-y-4 rounded-[28px] bg-superficie p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-400">Total de la semana</p>
            <p className="font-mono text-4xl font-bold leading-none">{decimal.format(total)}</p>
          </div>
          {anterior > 0 && (
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-xs font-bold
                ${diferencia >= 0 ? 'bg-primario text-fondo' : 'bg-elevado text-neutral-300'}`}
            >
              {diferencia >= 0 ? '+' : ''}{decimal.format(diferencia)} vs. semana anterior
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400">
          Cuentan las series con RIR ≤ 3 que no son calentamiento. Un músculo secundario suma 0.5.
          La franja gris es tu rango objetivo.
        </p>

        <ul className="space-y-3">
          {datos.musculos.map((m) => (
            <BarraMusculo key={m.id} musculo={m} escala={escala} />
          ))}
        </ul>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400" aria-hidden="true">
          {Object.entries(ESTADOS).map(([clave, e]) => (
            <span key={clave} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${e.barra}`} />
              {e.etiqueta}
            </span>
          ))}
        </div>
      </section>

      {total === 0 ? (
        <p className="rounded-3xl bg-superficie px-4 py-3 text-sm text-neutral-300">
          No registraste series efectivas esta semana.
        </p>
      ) : (
        cortos.length > 0 && (
          <p className="rounded-3xl bg-alerta/10 px-4 py-3 text-sm text-amber-200">
            <span className="font-bold">Por debajo de tu rango:</span>{' '}
            {cortos.map((m) => m.musculo).join(', ')}.
          </p>
        )
      )}
    </div>
  );
}