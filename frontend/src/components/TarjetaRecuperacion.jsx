import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Icono from './ui/Icono';
import MapaMuscular from './MapaMuscular';
import { COLOR, LISTO_DESDE, estadoRecuperacion } from '../utils/mapaMuscular';
import Enlace from './ui/Enlace';

export default function TarjetaRecuperacion() {
  const [musculos, setMusculos] = useState(null);

  useEffect(() => {
    api('/progreso/cuerpo')
      .then((datos) => setMusculos(datos.musculos))
      .catch(() => setMusculos([]));
  }, []);

  if (!musculos?.length) return null;

  const colores = Object.fromEntries(musculos.map((m) => [m.nombre, COLOR[estadoRecuperacion(m.recuperacion).clave]]));
  const listos = musculos.filter((m) => m.recuperacion >= LISTO_DESDE && m.ultimaVez);
  const cansados = musculos
    .filter((m) => m.recuperacion < LISTO_DESDE)
    .sort((a, b) => a.recuperacion - b.recuperacion);
  const sinDatos = musculos.every((m) => !m.ultimaVez);

  return (
    <Enlace to="/cuerpo" className="block rounded-[28px] bg-superficie p-4 transition hover:bg-elevado">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold tracking-tight">Recuperación</h2>
        <span className="flex items-center gap-1 text-sm font-semibold text-neutral-400">
          Ver tu cuerpo <Icono nombre="flecha" className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-3 flex gap-3">
        <div className="flex shrink-0 gap-1" aria-hidden="true">
          <MapaMuscular vista="frente" colores={colores} className="h-40 w-auto" />
          <MapaMuscular vista="espalda" colores={colores} className="h-40 w-auto" />
        </div>

        {sinDatos ? (
          <p className="self-center text-sm leading-relaxed text-neutral-400">
            Entrena y aquí verás qué tan recuperado está cada músculo.
          </p>
        ) : (
          <div className="min-w-0 flex-1 space-y-3">
            {cansados.length === 0 ? (
              <p className="text-sm font-semibold text-primario">Todo tu cuerpo está listo para entrenar.</p>
            ) : (
              <div>
                <p className="text-xs font-semibold text-neutral-400">Descansando</p>
                <ul className="mt-1.5 space-y-1">
                  {cansados.slice(0, 3).map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: COLOR[estadoRecuperacion(m.recuperacion).clave] }}
                      />
                      <span className="min-w-0 flex-1 truncate">{m.nombre}</span>
                      <span className="font-mono text-xs text-neutral-400">{m.recuperacion}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {listos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-neutral-400">Listos para hoy</p>
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {listos.slice(0, 4).map((m) => (
                    <li key={m.id} className="rounded-full bg-primario/15 px-2 py-0.5 text-xs font-bold text-primario">
                      {m.nombre}
                    </li>
                  ))}
                  {listos.length > 4 && (
                    <li className="rounded-full bg-elevado px-2 py-0.5 text-xs font-bold text-neutral-300">
                      +{listos.length - 4}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Enlace>
  );
}
