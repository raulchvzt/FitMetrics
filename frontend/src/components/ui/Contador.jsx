export default function Contador({ etiqueta, valor, min, max, paso = 1, formato = (v) => v, onChange }) {
  const cambiar = (delta) => onChange(Math.min(max, Math.max(min, valor + delta)));

  const claseBoton =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-elevado text-xl text-neutral-50 transition hover:bg-neutral-700 disabled:opacity-30';

  return (
    <div className="space-y-1">
      <span className="block text-xs text-neutral-400">{etiqueta}</span>
      <div className="flex h-12 items-center rounded-full bg-fondo px-1">
        <button
          type="button"
          onClick={() => cambiar(-paso)}
          disabled={valor <= min}
          aria-label={`Bajar ${etiqueta}`}
          className={claseBoton}
        >
          −
        </button>
        <span className="flex-1 text-center font-mono font-bold" aria-live="polite">
          {formato(valor)}
        </span>
        <button
          type="button"
          onClick={() => cambiar(paso)}
          disabled={valor >= max}
          aria-label={`Subir ${etiqueta}`}
          className={claseBoton}
        >
          +
        </button>
      </div>
    </div>
  );
}
