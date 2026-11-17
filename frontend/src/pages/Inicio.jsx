import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { plural } from '../utils/formato';
import Icono from '../components/ui/Icono';
import Avatar from '../components/ui/Avatar';
import PortadaRutina from '../components/PortadaRutina';
import BotonTema from '../components/BotonTema';
import NumeroAnimado from '../components/ui/NumeroAnimado';
import RecordatorioSuplementos from '../components/RecordatorioSuplementos';

function fechaDeHoy() {
  const texto = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date());
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const botonPrincipal =
  'inline-flex h-12 items-center gap-2 self-start rounded-full bg-primario px-5 font-extrabold text-sobre-primario transition hover:bg-primario-claro';

export default function Inicio() {
  const { usuario } = useAuth();
  const [rutinas, setRutinas] = useState(null);
  const [sesionActiva, setSesionActiva] = useState(null);
  const [error, setError] = useState('');
  const [suplementos, setSuplementos] = useState([]);

  useEffect(() => {
    // Los de "antes de entrenar" se recuerdan en la pantalla de entrenar
    api('/suplementos')
      .then((datos) => setSuplementos(
        datos.suplementos.filter((x) => x.pendienteHoy && x.momento !== 'AntesEntrenar')
      ))
      .catch(() => setSuplementos([]));
  }, []);

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
  // La sesión en curso muestra la foto de su rutina (una sesión libre no tiene)
  const portada = sesionActiva
    ? rutinas?.find((r) => r.id === sesionActiva.rutinaId) ?? {}
    : siguiente;

  return (
    <div className="escalonado space-y-4">
      <header className="flex items-center gap-3">
        <Link
          to="/perfil"
          aria-label="Mi perfil"
          title="Mi perfil"
          className="shrink-0 rounded-full border-2 border-primario p-0.5"
        >
          <Avatar usuario={usuario} className="h-11 w-11 text-lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-400">{fechaDeHoy()}</p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight">
            Hola, {usuario.nombre.split(' ')[0]}
          </h1>
        </div>
        <BotonTema />
      </header>

      {error && (
        <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {rutinas === null ? (
        <section className="flex min-h-48 items-center rounded-[28px] bg-superficie p-5">
          <p className="text-neutral-400">Cargando…</p>
        </section>
      ) : sesionActiva || siguiente ? (
        <PortadaRutina
          rutina={portada}
          className="flex min-h-56 flex-col justify-end gap-3 rounded-[28px] p-5 text-white"
        >
          <span className="self-start rounded-full bg-primario px-2.5 py-1 text-xs font-extrabold text-sobre-primario">
            {sesionActiva ? 'Entrenamiento en curso' : 'Hoy toca'}
          </span>
          <div className="space-y-1">
            <h2 className="truncate text-3xl font-extrabold tracking-tight">
              {sesionActiva ? sesionActiva.rutina ?? 'Sesión libre' : siguiente.nombre}
            </h2>
            {!sesionActiva && (
              <p className="font-mono text-sm text-white/75">
                {plural(siguiente.totalEjercicios, 'ejercicio')} · {plural(siguiente.totalSeries, 'serie')}
              </p>
            )}
          </div>
          <Link to="/entrenar" className={`${botonPrincipal} mt-1`}>
            <Icono nombre="play" className="h-4 w-4" />
            {sesionActiva ? 'Continuar' : 'Empezar'}
          </Link>
        </PortadaRutina>
      ) : (
        <section className="flex min-h-48 flex-col gap-3 rounded-[28px] bg-superficie p-5">
          <h2 className="text-2xl font-extrabold tracking-tight">Crea tu primera rutina</h2>
          <p className="text-sm text-neutral-400">Organiza tus días de entrenamiento para empezar.</p>
          <Link to="/rutinas" className={`${botonPrincipal} mt-auto`}>
            Ir a rutinas
            <Icono nombre="avanzar" className="h-4 w-4" />
          </Link>
        </section>
      )}

      <RecordatorioSuplementos suplementos={suplementos} onCambio={setSuplementos} />

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-superficie p-4">
          <p className="text-xs text-neutral-400">Rutinas</p>
          <p className="mt-1 font-mono text-3xl font-bold">
            {rutinas ? <NumeroAnimado valor={rutinas.length} /> : '—'}
          </p>
        </div>
        <div className="rounded-3xl bg-superficie p-4">
          <p className="text-xs text-neutral-400">Unidad</p>
          <p className="mt-1 font-mono text-3xl font-bold">{usuario.unidadPeso}</p>
        </div>
      </section>

      <Link
        to="/historial"
        className="flex items-center gap-3 rounded-3xl bg-superficie p-3 pr-4 transition hover:bg-elevado"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-elevado text-primario">
          <Icono nombre="progreso" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Historial</span>
          <span className="block text-sm text-neutral-400">Tus entrenamientos terminados</span>
        </span>
        <Icono nombre="flecha" className="h-5 w-5 shrink-0 text-neutral-500" />
      </Link>
    </div>
  );
}