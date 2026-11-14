import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { plural } from '../utils/formato';
import Icono from '../components/ui/Icono';

function fechaDeHoy() {
  const texto = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date());
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const botonPrincipal =
  'inline-flex h-12 items-center gap-2 self-start rounded-full bg-primario px-5 font-extrabold text-fondo transition hover:bg-primario-claro';

function DiscosDecorativos() {
  return (
    <svg
      viewBox="0 0 140 196"
      className="pointer-events-none absolute -right-5 top-0 h-full w-36"
      aria-hidden="true"
    >
      <rect x="20" y="88" width="120" height="10" rx="5" fill="#2A2A2A" />
      <rect x="70" y="18" width="24" height="150" rx="8" fill="#D4FF3F" />
      <rect x="98" y="38" width="18" height="110" rx="6" fill="#1F1F1F" stroke="#3A3A3A" strokeWidth="1.5" />
      <rect x="50" y="78" width="12" height="30" rx="3" fill="#6B6B6B" />
    </svg>
  );
}

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
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primario bg-elevado text-lg font-extrabold"
        >
          {inicial}
        </button>
        <div className="min-w-0">
          <p className="text-sm text-neutral-400">{fechaDeHoy()}</p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight">
            Hola, {usuario.nombre.split(' ')[0]}
          </h1>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <section className="relative flex min-h-48 flex-col gap-3 overflow-hidden rounded-[28px] bg-superficie p-5">
        {rutinas === null ? (
          <p className="text-neutral-400">Cargando…</p>
        ) : sesionActiva ? (
          <>
            <DiscosDecorativos />
            <span className="self-start rounded-full bg-primario/15 px-2.5 py-1 text-xs font-bold text-primario">
              Entrenamiento en curso
            </span>
            <h2 className="relative pr-24 text-3xl font-extrabold tracking-tight">
              {sesionActiva.rutina ?? 'Sesión libre'}
            </h2>
            <Link to="/entrenar" className={`${botonPrincipal} relative mt-auto`}>
              <Icono nombre="play" className="h-4 w-4" />
              Continuar
            </Link>
          </>
        ) : siguiente ? (
          <>
            <DiscosDecorativos />
            <span className="self-start rounded-full bg-primario/15 px-2.5 py-1 text-xs font-bold text-primario">
              Hoy toca
            </span>
            <div className="relative space-y-1 pr-24">
              <h2 className="truncate text-3xl font-extrabold tracking-tight">{siguiente.nombre}</h2>
              <p className="font-mono text-sm text-neutral-400">
                {plural(siguiente.totalEjercicios, 'ejercicio')} · {plural(siguiente.totalSeries, 'serie')}
              </p>
            </div>
            <Link to="/entrenar" className={`${botonPrincipal} relative mt-auto`}>
              <Icono nombre="play" className="h-4 w-4" />
              Empezar
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold tracking-tight">Crea tu primera rutina</h2>
            <p className="text-sm text-neutral-400">Organiza tus días de entrenamiento para empezar.</p>
            <Link to="/rutinas" className={`${botonPrincipal} mt-auto`}>
              Ir a rutinas
              <Icono nombre="avanzar" className="h-4 w-4" />
            </Link>
          </>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-superficie p-4">
          <p className="text-xs text-neutral-400">Rutinas</p>
          <p className="mt-1 font-mono text-3xl font-bold">{rutinas?.length ?? '—'}</p>
        </div>
        <div className="rounded-3xl bg-superficie p-4">
          <p className="text-xs text-neutral-400">Unidad</p>
          <p className="mt-1 font-mono text-3xl font-bold">{usuario.unidadPeso}</p>
        </div>
      </section>
    </div>
  );
}
