import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { plural } from '../utils/formato';

function fechaDeHoy() {
  const texto = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date());
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const botonPrincipal =
  'flex h-13 items-center justify-center rounded-xl bg-primario font-semibold text-white transition hover:bg-blue-500';

export default function Inicio() {
  const { usuario, logout } = useAuth();
  const [rutinas, setRutinas] = useState(null);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/rutinas'), api('/sesiones/activa')])
      .then(([listaRutinas, activa]) => {
        setRutinas(listaRutinas);
        setSesionActiva(activa);
      })
      .catch((err) => {
        setError(err.message);
        setRutinas([]);
      });
  }, []);

  const siguiente = rutinas?.[0];
  const inicial = usuario.nombre.trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{fechaDeHoy()}</p>
          <h1 className="text-2xl font-bold">Hola, {usuario.nombre.split(' ')[0]}</h1>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-borde bg-superficie font-semibold"
        >
          {inicial}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-peligro/40 bg-peligro/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-borde bg-superficie p-5">
        {rutinas === null ? (
          <p className="text-slate-400">Cargando…</p>
        ) : sesionActiva ? (
          <>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Entrenamiento en curso
            </span>
            <h2 className="text-2xl font-bold">{sesionActiva.rutina ?? 'Sesión libre'}</h2>
            <Link to="/entrenar" className={botonPrincipal}>Continuar entrenamiento</Link>
          </>
        ) : siguiente ? (
          <>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hoy toca</span>
            <div>
              <h2 className="text-2xl font-bold">{siguiente.nombre}</h2>
                <p className="font-mono text-sm text-slate-400">
                {plural(siguiente.totalEjercicios, 'ejercicio')} · {plural(siguiente.totalSeries, 'serie')}
              </p>
            </div>
            <Link to="/entrenar" className={botonPrincipal}>Empezar entrenamiento</Link>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Crea tu primera rutina</h2>
            <p className="text-sm text-slate-400">Organiza tus días de entrenamiento para empezar.</p>
            <Link to="/rutinas" className={botonPrincipal}>Ir a rutinas</Link>
          </>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-borde bg-superficie p-4">
          <p className="text-xs text-slate-400">Rutinas</p>
          <p className="mt-1 font-mono text-3xl font-bold">{rutinas?.length ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-borde bg-superficie p-4">
          <p className="text-xs text-slate-400">Unidad</p>
          <p className="mt-1 font-mono text-3xl font-bold">{usuario.unidadPeso}</p>
        </div>
      </section>
    </div>
  );
}