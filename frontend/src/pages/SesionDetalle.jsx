import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { formatoDuracion, formatoFechaHora, formatoNumero } from '../utils/formato';
import Icono from '../components/ui/Icono';
import TablaSeries from '../components/TablaSeries';

function Dato({ etiqueta, valor, destacado = false }) {
  return (
    <div className="rounded-3xl bg-superficie p-4">
      <p className="text-xs text-neutral-400">{etiqueta}</p>
      <p className={`mt-1 font-mono text-2xl font-bold ${destacado ? 'text-primario' : ''}`}>{valor}</p>
    </div>
  );
}

export default function SesionDetalle() {
  const { id } = useParams();
  const [sesion, setSesion] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    api(`/sesiones/${id}`)
      .then((datos) => activo && setSesion(datos))
      .catch((err) => activo && setError(err.status === 404 ? 'Entrenamiento no encontrado' : err.message));
    return () => {
      activo = false;
    };
  }, [id]);

  const volver = (
    <Link
      to="/historial"
      aria-label="Volver al historial"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
    >
      <Icono nombre="atras" className="h-5 w-5" />
    </Link>
  );

  if (error) {
    return (
      <div className="space-y-4">
        {volver}
        <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (!sesion) return <p className="text-neutral-400">Cargando…</p>;

  const todas = sesion.ejercicios.flatMap((e) => e.series);
  const efectivas = todas.filter((s) => s.esEfectiva).length;
  const volumen = todas
    .filter((s) => !s.esCalentamiento)
    .reduce((total, s) => total + s.peso * s.reps, 0);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        {volver}
        <div className="min-w-0">
          <p className="text-xs text-neutral-400">{formatoFechaHora(sesion.fechaInicio)}</p>
          <h1 className="truncate text-2xl font-extrabold tracking-tight">{sesion.rutina ?? 'Sesión libre'}</h1>
        </div>
      </header>

      {sesion.enCurso && (
        <Link to="/entrenar" className="block rounded-3xl bg-primario/10 px-4 py-3 text-sm font-semibold text-primario">
          Este entrenamiento sigue en curso. Toca aquí para continuarlo.
        </Link>
      )}

      <section className="grid grid-cols-2 gap-3">
        <Dato etiqueta="Duración" valor={formatoDuracion(sesion.segundosTranscurridos ?? 0)} />
        <Dato etiqueta="Series efectivas" valor={efectivas} destacado />
        <Dato etiqueta={`Volumen (${sesion.unidad})`} valor={formatoNumero(volumen)} />
        <Dato etiqueta="Fatiga" valor={sesion.fatigaPercibida ? `${sesion.fatigaPercibida}/10` : '—'} />
      </section>

      {sesion.ejercicios.map((ejercicio) => (
        <article key={ejercicio.ejercicioId} className="space-y-3 rounded-3xl bg-superficie p-4">
          <h2 className="text-lg font-extrabold">{ejercicio.nombre}</h2>
          <TablaSeries series={ejercicio.series} unidad={sesion.unidad} />
        </article>
      ))}
    </div>
  );
}