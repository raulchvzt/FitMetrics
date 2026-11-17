import { useEffect, useState } from 'react';
import { formatoTiempo } from '../utils/formato';

const RADIO = 30;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

export default function TemporizadorDescanso({ finEn, total, siguiente, onSumar, onSaltar, onTerminar }) {
  const [ahora, setAhora] = useState(finEn - total * 1000);

  useEffect(() => {
    const intervalo = setInterval(() => {
      const momento = Date.now();
      setAhora(momento);
      if (momento >= finEn) {
        clearInterval(intervalo);
        onTerminar();
      }
    }, 250);
    return () => clearInterval(intervalo);
  }, [finEn, onTerminar]);

  const restante = Math.max(0, Math.ceil((finEn - ahora) / 1000));
  const avance = total > 0 ? restante / total : 0;

  return (
    <section
      aria-label="Descanso"
      className="sticky top-[calc(0.5rem+env(safe-area-inset-top))] z-10 flex items-center gap-4 rounded-3xl
                 border border-borde bg-superficie/95 p-3 pr-4 shadow-lg shadow-sombra/60 backdrop-blur"
    >
      <div className="relative h-18 w-18 shrink-0">
        <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="36" cy="36" r={RADIO} fill="none" strokeWidth="6" className="stroke-borde" />
          <circle
            cx="36" cy="36" r={RADIO} fill="none" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - avance)}
            className="stroke-dato transition-[stroke-dashoffset] duration-300"
          />
        </svg>
        <span
          role="timer"
          aria-live="off"
          className="absolute inset-0 flex items-center justify-center font-mono text-base font-bold tabular-nums"
        >
          {formatoTiempo(restante)}
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="min-w-0">
          <p className="text-xs text-neutral-400">Descansando · sigue</p>
          <p className="truncate text-sm font-bold">{siguiente}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSumar}
            className="h-11 flex-1 rounded-full bg-elevado font-mono text-sm font-bold transition hover:bg-neutral-700"
          >
            +30 s
          </button>
          <button
            type="button"
            onClick={onSaltar}
            className="h-11 flex-1 rounded-full bg-elevado text-sm font-bold transition hover:bg-neutral-700"
          >
            Saltar
          </button>
        </div>
      </div>
    </section>
  );
}