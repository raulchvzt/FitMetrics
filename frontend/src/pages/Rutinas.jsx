import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Icono from '../components/ui/Icono';

export default function Rutinas() {
  const [rutinas, setRutinas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/rutinas')
      .then(setRutinas)
      .catch((err) => {
        setError(err.message);
        setRutinas([]);
      });
  }, []);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rutinas</h1>
        <Link
          to="/rutinas/nueva"
          className="flex h-11 items-center gap-1.5 rounded-xl bg-primario px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <Icono nombre="mas" className="h-4 w-4" />
          Nueva
        </Link>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-peligro/40 bg-peligro/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {rutinas === null ? (
        <p className="text-slate-400">Cargando…</p>
      ) : rutinas.length === 0 ? (
        <div className="space-y-2 rounded-2xl border border-dashed border-borde p-6 text-center">
          <p className="font-semibold">Aún no tienes rutinas</p>
          <p className="text-sm text-slate-400">
            Crea una por cada día de entrenamiento, por ejemplo "Torso A" o "Pierna A".
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rutinas.map((r) => (
            <li key={r.id}>
              <Link
                to={`/rutinas/${r.id}`}
                className="flex items-center gap-3 rounded-2xl border border-borde bg-superficie p-4 transition hover:border-slate-500"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">{r.nombre}</h2>
                  {r.descripcion && (
                    <p className="truncate text-sm text-slate-400">{r.descripcion}</p>
                  )}
                  <p className="mt-1 font-mono text-sm text-slate-400">
                    {r.totalEjercicios} ejercicios · {r.totalSeries} series
                  </p>
                </div>
                <Icono nombre="flecha" className="h-5 w-5 shrink-0 text-slate-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}