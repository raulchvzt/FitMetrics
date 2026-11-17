import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, descargar } from '../../services/api';
import { aFecha, formatoDiaMes } from '../../utils/fechas';
import { plural } from '../../utils/formato';
import Icono from '../ui/Icono';

const PERIODOS = [
  { dias: 30, etiqueta: '30 días', descripcion: 'los últimos 30 días' },
  { dias: 90, etiqueta: '3 meses', descripcion: 'los últimos 3 meses' },
  { dias: 180, etiqueta: '6 meses', descripcion: 'los últimos 6 meses' },
  { dias: 365, etiqueta: '1 año', descripcion: 'el último año' }
];

const DESCARGAS_CSV = [
  { tipo: 'series', etiqueta: 'Series' },
  { tipo: 'sesiones', etiqueta: 'Sesiones' },
  { tipo: 'suplementos', etiqueta: 'Suplementos' }
];

const COLOR = {
  barra: '#D4FF3F',
  rejilla: '#2A2A2A',
  ejes: '#A3A3A3'
};

const entero = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
const mesCorto = new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: 'UTC' });
const mesLargo = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function etiquetaGrupo(inicio, agrupacion, larga = false) {
  if (agrupacion === 'mes') {
    return larga ? mesLargo.format(aFecha(inicio)) : mesCorto.format(aFecha(inicio)).replace('.', '');
  }
  return larga ? `Semana del ${formatoDiaMes(inicio)}` : formatoDiaMes(inicio);
}

// ---------- Piezas ----------

function Variacion({ valor }) {
  if (valor === null || valor === undefined) return null;
  const sube = valor >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-xs font-bold
        ${sube ? 'bg-primario/15 text-primario' : 'bg-elevado text-neutral-300'}`}
      title="Comparado con el periodo anterior"
    >
      <Icono nombre={sube ? 'arriba' : 'abajo'} className="h-3 w-3" />
      {Math.abs(valor)}%
    </span>
  );
}

function Indicador({ etiqueta, valor, unidad, variacion, nota }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-superficie p-4">
      <p className="text-xs text-neutral-400">{etiqueta}</p>
      <p className="font-mono text-2xl font-bold leading-tight">
        {valor}
        {unidad && <span className="ml-1 text-sm text-neutral-400">{unidad}</span>}
      </p>
      <div className="mt-auto flex min-h-5 items-center gap-2">
        <Variacion valor={variacion} />
        {nota && <span className="truncate text-xs text-neutral-400">{nota}</span>}
      </div>
    </div>
  );
}

function ContenidoTooltip({ active, payload, agrupacion, unidad }) {
  if (!active || !payload?.length) return null;
  const grupo = payload[0].payload;
  return (
    <div className="rounded-2xl border border-borde bg-fondo px-3 py-2 shadow-lg shadow-black/60">
      <p className="text-xs text-neutral-400">{etiquetaGrupo(grupo.inicio, agrupacion, true)}</p>
      <p className="font-mono text-base font-bold text-neutral-50">
        {plural(grupo.seriesEfectivas, 'serie efectiva', 'series efectivas')}
      </p>
      <p className="font-mono text-xs text-neutral-300">
        {plural(grupo.sesiones, 'sesión', 'sesiones')} · {entero.format(grupo.volumen)} {unidad}
      </p>
    </div>
  );
}

function GraficaEvolucion({ evolucion, agrupacion, unidad }) {
  return (
    <section className="space-y-3 rounded-[28px] bg-superficie p-5">
      <div>
        <h3 className="font-extrabold">Series efectivas por {agrupacion}</h3>
        <p className="text-xs text-neutral-400">
          {agrupacion === 'semana' ? 'De lunes a domingo' : 'Suma de todo el mes'}
        </p>
      </div>
      <figure className="-mx-2 h-48" aria-label={`Series efectivas por ${agrupacion}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={evolucion} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="25%">
            <CartesianGrid vertical={false} stroke={COLOR.rejilla} />
            <XAxis
              dataKey="inicio"
              tickFormatter={(v) => etiquetaGrupo(v, agrupacion)}
              tick={{ fill: COLOR.ejes, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: COLOR.ejes, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              content={<ContenidoTooltip agrupacion={agrupacion} unidad={unidad} />}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar
              dataKey="seriesEfectivas"
              fill={COLOR.barra}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </figure>
    </section>
  );
}

const INICIALES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function DiasSemana({ frecuencia }) {
  const maximo = Math.max(...frecuencia.map((d) => d.sesiones), 1);
  const favorito = frecuencia.reduce((mejor, d) => (d.sesiones > mejor.sesiones ? d : mejor));

  return (
    <section className="space-y-3 rounded-[28px] bg-superficie p-5">
      <div>
        <h3 className="font-extrabold">Días que más entrenas</h3>
        {favorito.sesiones > 0 && (
          <p className="text-xs text-neutral-400">Tu día más constante: {favorito.dia.toLowerCase()}</p>
        )}
      </div>
      <ul className="grid h-32 grid-cols-7 items-end gap-2">
        {frecuencia.map((d, i) => (
          <li
            key={d.dia}
            className="flex h-full flex-col items-center justify-end gap-1"
            aria-label={`${d.dia}: ${plural(d.sesiones, 'sesión', 'sesiones')}`}
          >
            <span className="font-mono text-xs font-bold text-neutral-300">{d.sesiones}</span>
            <div
              className={`w-full max-w-7 rounded-md ${d.sesiones > 0 ? 'bg-primario' : 'bg-elevado'}`}
              style={{ height: d.sesiones > 0 ? `${(d.sesiones / maximo) * 72}%` : '4px' }}
            />
            <span className="text-xs text-neutral-400">{INICIALES[i]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Ejercicios({ ejercicios, unidad }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-bold text-neutral-400">Ejercicios más trabajados</h3>
      <ol className="space-y-2">
        {ejercicios.map((e, i) => (
          <li key={e.id} className="flex items-center gap-3 rounded-3xl bg-superficie px-4 py-3">
            <span className="w-4 shrink-0 font-mono text-sm font-bold text-neutral-500">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{e.nombre}</p>
              <p className="text-xs text-neutral-400">
                {plural(e.seriesEfectivas, 'serie efectiva', 'series efectivas')} · {plural(e.sesiones, 'sesión', 'sesiones')}
              </p>
            </div>
            {e.mejorE1rm !== null && (
              <div className="text-right">
                <p className="font-mono text-sm font-bold">
                  {decimal.format(e.mejorE1rm)} <span className="text-neutral-400">{unidad}</span>
                </p>
                <p className="text-[11px] text-neutral-500">1RM est.</p>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

const ESTADO_MUSCULO = {
  bajo: { etiqueta: 'Por debajo', clase: 'bg-alerta/15 text-alerta' },
  alto: { etiqueta: 'Por encima', clase: 'bg-red-500/15 text-red-300' }
};

function Musculos({ musculos }) {
  const fuera = musculos.filter((m) => m.estado !== 'enRango');
  const enRango = musculos.length - fuera.length;

  return (
    <section className="space-y-3 rounded-[28px] bg-superficie p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold">Volumen por músculo</h3>
          <p className="text-xs text-neutral-400">Promedio de series efectivas por semana</p>
        </div>
        <span className="shrink-0 rounded-full bg-elevado px-2.5 py-1 font-mono text-xs font-bold">
          {enRango}/{musculos.length} en rango
        </span>
      </div>

      {fuera.length === 0 ? (
        <p className="text-sm text-neutral-300">Todos tus músculos están dentro de su rango. ¡Bien!</p>
      ) : (
        <ul className="divide-y divide-borde">
          {fuera.map((m) => {
            const estado = ESTADO_MUSCULO[m.estado];
            return (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <span className="flex-1 truncate text-sm">{m.musculo}</span>
                <span className="font-mono text-sm">
                  {decimal.format(m.promedioSemanal)}
                  <span className="text-neutral-500"> / {m.minimo}–{m.maximo}</span>
                </span>
                <span className={`w-24 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-bold ${estado.clase}`}>
                  {estado.etiqueta}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Link to="/progreso?vista=volumen" className="inline-block text-sm font-bold text-primario hover:underline">
        Ver volumen semana por semana
      </Link>
    </section>
  );
}

function Suplementos({ suplementos }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-400">Suplementos</h3>
        <Link to="/suplementos" className="text-sm font-bold text-primario hover:underline">Inventario</Link>
      </div>
      <ul className="space-y-2">
        {suplementos.map((s) => {
          const estado = s.agotado
            ? { texto: 'Agotado', clase: 'text-red-300' }
            : s.requiereReposicion
              ? { texto: `Quedan ${plural(s.diasRestantes, 'día')}`, clase: 'text-alerta' }
              : { texto: `Quedan ${plural(s.diasRestantes, 'día')}`, clase: 'text-neutral-400' };
          return (
            <li key={s.id} className="flex items-center gap-3 rounded-3xl bg-superficie px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{s.nombre}</p>
                <p className={`text-xs ${estado.clase}`}>{estado.texto}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold">{s.tomas}</p>
                <p className="text-[11px] text-neutral-500">{s.tomas === 1 ? 'toma' : 'tomas'}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Exportar({ dias }) {
  const [descargando, setDescargando] = useState(null);
  const [error, setError] = useState('');
  const periodo = PERIODOS.find((p) => p.dias === dias).descripcion;

  async function bajar(clave, ruta) {
    setError('');
    setDescargando(clave);
    try {
      await descargar(ruta);
    } catch (err) {
      setError(err.message);
    } finally {
      setDescargando(null);
    }
  }

  return (
    <section className="space-y-3 rounded-[28px] border border-borde p-5">
      <div>
        <h3 className="font-extrabold">Exportar</h3>
        <p className="text-xs text-neutral-400">Con los datos de {periodo}</p>
      </div>

      <button
        type="button"
        onClick={() => bajar('pdf', `/reportes/pdf?dias=${dias}`)}
        disabled={descargando !== null}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primario font-extrabold text-fondo
                   transition hover:bg-primario-claro disabled:opacity-60"
      >
        <Icono nombre="descargar" className="h-5 w-5" />
        {descargando === 'pdf' ? 'Generando…' : 'Reporte en PDF'}
      </button>

      <div>
        <p className="mb-2 text-xs text-neutral-400">Datos en CSV (se abren en Excel)</p>
        <div className="grid grid-cols-3 gap-2">
          {DESCARGAS_CSV.map((d) => (
            <button
              key={d.tipo}
              type="button"
              onClick={() => bajar(d.tipo, `/reportes/csv?tipo=${d.tipo}&dias=${dias}`)}
              disabled={descargando !== null}
              className="h-11 rounded-full bg-elevado text-sm font-bold transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {descargando === d.tipo ? '…' : d.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </section>
  );
}

// ---------- Pantalla ----------

export default function ResumenGeneral() {
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    api(`/reportes/resumen?dias=${dias}`)
      .then((respuesta) => {
        if (activo) {
          setDatos(respuesta);
          setError('');
        }
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });
    return () => {
      activo = false;
    };
  }, [dias]);

  const actualizado = datos?.periodo.dias === dias;

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Periodo" className="grid grid-cols-4 gap-1 rounded-full bg-superficie p-1">
        {PERIODOS.map((p) => (
          <button
            key={p.dias}
            type="button"
            aria-pressed={dias === p.dias}
            onClick={() => setDias(p.dias)}
            className={`h-9 rounded-full text-sm font-bold transition
              ${dias === p.dias ? 'bg-primario text-fondo' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!datos ? (
        !error && <p className="text-neutral-400">Cargando…</p>
      ) : (
        <div className={`space-y-4 transition-opacity ${actualizado ? '' : 'opacity-50'}`}>
          <p className="text-sm text-neutral-400">
            Del {formatoDiaMes(datos.periodo.inicio)} al {formatoDiaMes(datos.periodo.fin)} · comparado con los{' '}
            {datos.periodo.dias} días anteriores
          </p>

          <section className="grid grid-cols-2 gap-3">
            <Indicador
              etiqueta="Sesiones"
              valor={entero.format(datos.totales.sesiones)}
              variacion={datos.totales.variacion.sesiones}
              nota={datos.totales.minutosPromedio !== null ? `${datos.totales.minutosPromedio} min prom.` : null}
            />
            <Indicador
              etiqueta="Por semana"
              valor={decimal.format(datos.totales.sesionesPorSemana)}
              unidad="ses."
              nota={plural(datos.totales.diasEntrenados, 'día entrenado', 'días entrenados')}
            />
            <Indicador
              etiqueta="Series efectivas"
              valor={entero.format(datos.totales.seriesEfectivas)}
              variacion={datos.totales.variacion.seriesEfectivas}
            />
            <Indicador
              etiqueta="Volumen"
              valor={entero.format(datos.totales.volumen)}
              unidad={datos.unidad}
              variacion={datos.totales.variacion.volumen}
            />
          </section>

          {datos.totales.sesiones === 0 ? (
            <div className="space-y-2 rounded-3xl border border-dashed border-neutral-700 p-6 text-center">
              <p className="font-bold">Sin entrenamientos en este periodo</p>
              <p className="text-sm text-neutral-400">
                Cuando termines un entrenamiento aquí verás tu frecuencia, tus ejercicios principales y tu volumen.
              </p>
            </div>
          ) : (
            <>
              <GraficaEvolucion evolucion={datos.evolucion} agrupacion={datos.periodo.agrupacion} unidad={datos.unidad} />
              <DiasSemana frecuencia={datos.frecuencia} />
              <Ejercicios ejercicios={datos.ejercicios} unidad={datos.unidad} />
              <Musculos musculos={datos.musculos} />
            </>
          )}

          {datos.suplementos.length > 0 && <Suplementos suplementos={datos.suplementos} />}

          <Exportar dias={dias} />
        </div>
      )}
    </div>
  );
}