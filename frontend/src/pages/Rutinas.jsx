import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Icono from '../components/ui/Icono';
import { plural } from '../utils/formato';

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
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight">Rutinas</h1>
          {rutinas?.length > 0 && (
            <p className="text-sm text-neutral-400">{plural(rutinas.length, 'rutina activa', 'rutinas activas')}</p>
          )}
        </div>
        <Link
          to="/rutinas/nueva"
          aria-label="Nueva rutina"
          title="Nueva rutina"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-primario text-fondo transition hover:bg-primario-claro"
        >
          <Icono nombre="mas" className="h-6 w-6" />
        </Link>
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {rutinas === null ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : rutinas.length === 0 ? (
        <div className="space-y-2 rounded-3xl border border-dashed border-neutral-700 p-6 text-center">
          <p className="font-bold">Aún no tienes rutinas</p>
          <p className="text-sm text-neutral-400">
            Crea una por cada día de entrenamiento, por ejemplo "Torso A" o "Pierna A".
          </p>
        </div>
      ) : (
        <ul className="escalonado space-y-3">
          {rutinas.map((r) => (
            <li key={r.id}>
              <Link
                to={`/rutinas/${r.id}`}
                className="flex items-center gap-3 rounded-3xl bg-superficie p-3 pr-4 transition hover:bg-elevado"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-elevado text-primario">
                  <Icono nombre="entrenar" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold">{r.nombre}</h2>
                  {r.descripcion && (
                    <p className="truncate text-sm text-neutral-400">{r.descripcion}</p>
                  )}
                  <p className="font-mono text-xs text-neutral-400">
                    {plural(r.totalEjercicios, 'ejercicio')} · {plural(r.totalSeries, 'serie')}
                  </p>
                </div>
                <Icono nombre="flecha" className="h-5 w-5 shrink-0 text-neutral-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
