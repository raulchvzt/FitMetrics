import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatoFechaHora, formatoMes, formatoNumero, plural } from '../utils/formato';
import Icono from '../components/ui/Icono';

const POR_PAGINA = 15;

function agruparPorMes(sesiones) {
  const grupos = [];
  for (const sesion of sesiones) {
    const mes = formatoMes(sesion.fechaInicio);
    const ultimo = grupos.at(-1);
    if (ultimo?.mes === mes) ultimo.sesiones.push(sesion);
    else grupos.push({ mes, sesiones: [sesion] });
  }
  return grupos;
}

export default function Historial() {
  const [sesiones, setSesiones] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/sesiones?pagina=1&limite=${POR_PAGINA}`)
      .then((lista) => {
        setSesiones(lista);
        setHayMas(lista.length === POR_PAGINA);
      })
      .catch((err) => {
        setError(err.message);
        setSesiones([]);
      });
  }, []);

  async function cargarMas() {
    setCargandoMas(true);
    try {
      const siguiente = pagina + 1;
      const lista = await api(`/sesiones?pagina=${siguiente}&limite=${POR_PAGINA}`);
      setSesiones((actuales) => [...actuales, ...lista]);
      setPagina(siguiente);
      setHayMas(lista.length === POR_PAGINA);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoMas(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Volver al inicio"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
        >
          <Icono nombre="atras" className="h-5 w-5" />
        </Link>
        <h1 className="text-[28px] font-extrabold tracking-tight">Historial</h1>
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {sesiones === null ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : sesiones.length === 0 ? (
        <div className="space-y-3 rounded-3xl border border-dashed border-neutral-700 p-6 text-center">
          <p className="font-bold">Aún no tienes entrenamientos terminados</p>
          <p className="text-sm text-neutral-400">Cuando finalices uno, aparecerá aquí.</p>
          <Link to="/entrenar" className="inline-flex h-12 items-center rounded-full bg-primario px-5 font-extrabold text-fondo">
            Empezar a entrenar
          </Link>
        </div>
      ) : (
        agruparPorMes(sesiones).map((grupo) => (
          <section key={grupo.mes} className="space-y-3">
            <h2 className="text-sm font-bold text-neutral-400">{grupo.mes}</h2>
            <ul className="space-y-3">
              {grupo.sesiones.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/historial/${s.id}`}
                    className="flex items-center gap-3 rounded-3xl bg-superficie p-4 transition hover:bg-elevado"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs text-neutral-400">{formatoFechaHora(s.fechaInicio)}</p>
                      <h3 className="truncate font-bold">{s.rutina ?? 'Sesión libre'}</h3>
                      <p className="font-mono text-xs text-neutral-400">
                        {s.duracionMin} min · <span className="text-primario">{s.seriesEfectivas} efectivas</span> ·{' '}
                        {formatoNumero(s.volumen)} {s.unidad}
                      </p>
                    </div>
                    <Icono nombre="flecha" className="h-5 w-5 shrink-0 text-neutral-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {hayMas && (
        <button
          type="button"
          onClick={cargarMas}
          disabled={cargandoMas}
          className="h-12 w-full rounded-full bg-elevado text-sm font-bold transition hover:bg-neutral-700 disabled:opacity-60"
        >
          {cargandoMas ? 'Cargando…' : 'Cargar más'}
        </button>
      )}

      {sesiones?.length > 0 && !hayMas && (
        <p className="text-center text-xs text-neutral-500">
          {plural(sesiones.length, 'entrenamiento', 'entrenamientos')} en total
        </p>
      )}
    </div>
  );
}