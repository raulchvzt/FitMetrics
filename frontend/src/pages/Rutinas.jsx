import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Icono from '../components/ui/Icono';
import PortadaRutina from '../components/PortadaRutina';
import { plural } from '../utils/formato';
import { EsqueletoLista } from '../components/ui/Esqueleto';
import Enlace from '../components/ui/Enlace';

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
        <Enlace
          to="/rutinas/nueva"
          aria-label="Nueva rutina"
          title="Nueva rutina"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-primario text-sobre-primario transition hover:bg-primario-claro"
        >
          <Icono nombre="mas" className="h-6 w-6" />
        </Enlace>
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {rutinas === null ? (
        <EsqueletoLista filas={3} alto="h-44" redondeo="rounded-[28px]" etiqueta="Cargando rutinas" />
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
              <Enlace to={`/rutinas/${r.id}`} state={{ rutina: r }} className="block rounded-3xl">
                <PortadaRutina rutina={r} nombreTransicion={`rutina-${r.id}`} className="flex h-36 items-end gap-3 rounded-3xl p-4 text-white">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-extrabold tracking-tight">{r.nombre}</h2>
                    {r.descripcion && (
                      <p className="truncate text-sm text-white/75">{r.descripcion}</p>
                    )}
                    <p className="font-mono text-xs text-white/75">
                      {plural(r.totalEjercicios, 'ejercicio')} · {plural(r.totalSeries, 'serie')}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                    <Icono nombre="flecha" className="h-5 w-5" />
                  </span>
                </PortadaRutina>
              </Enlace>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
