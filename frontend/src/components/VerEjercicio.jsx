import { useEffect, useState } from 'react';
import { fotosDeEjercicio } from '../utils/imagenEjercicio';
import HojaInferior from './ui/HojaInferior';

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Hoja "Cómo se hace": alterna la foto inicial y la final como una animación
export default function VerEjercicio({ ejercicio, onCerrar }) {
  const fotos = fotosDeEjercicio(ejercicio);
  const [cuadro, setCuadro] = useState(0);
  const [pausado, setPausado] = useState(sinMovimiento);

  useEffect(() => {
    if (fotos.length < 2 || pausado) return undefined;
    const reloj = setInterval(() => setCuadro((c) => (c + 1) % 2), 1100);
    return () => clearInterval(reloj);
  }, [fotos.length, pausado]);

  const musculos = [...(ejercicio.musculos ?? [])].sort((a, b) => Number(b.factor) - Number(a.factor));

  return (
    <HojaInferior titulo={ejercicio.nombre} onCerrar={onCerrar}>
      {fotos.length === 0 ? (
        <p className="rounded-2xl bg-elevado px-4 py-6 text-center text-sm text-neutral-400">
          Este ejercicio no tiene imagen.
          {ejercicio.propio && ' Puedes agregarle una foto desde "Editar ejercicio".'}
        </p>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setPausado((p) => !p)}
            aria-label={pausado ? 'Reproducir animación' : 'Pausar animación'}
            className="sin-presion relative block aspect-[3/2] w-full overflow-hidden rounded-2xl bg-elevado"
          >
            {fotos.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={fotos.length === 2 ? `${ejercicio.nombre}: posición ${i === 0 ? 'inicial' : 'final'}` : ejercicio.nombre}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300
                  ${i === cuadro ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </button>

          {fotos.length === 2 && (
            <div className="grid grid-cols-2 gap-1 rounded-full bg-fondo p-1" role="group" aria-label="Posición">
              {['Inicio', 'Final'].map((etiqueta, i) => (
                <button
                  key={etiqueta}
                  type="button"
                  aria-pressed={cuadro === i}
                  onClick={() => {
                    setPausado(true);
                    setCuadro(i);
                  }}
                  className={`h-9 rounded-full text-sm font-bold transition
                    ${cuadro === i ? 'bg-primario text-sobre-primario' : 'text-neutral-400'}`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {musculos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ejercicio.equipo && (
            <span className="rounded-full bg-elevado px-2.5 py-1 text-xs font-semibold text-neutral-300">{ejercicio.equipo}</span>
          )}
          {musculos.map((m) => (
            <span
              key={m.nombre}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold
                ${Number(m.factor) === 1 ? 'bg-primario/15 text-primario' : 'bg-elevado text-neutral-300'}`}
            >
              {m.nombre}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onCerrar}
        className="h-12 w-full rounded-full bg-elevado font-bold transition hover:bg-neutral-800"
      >
        Listo
      </button>
    </HojaInferior>
  );
}
