export default function Contador({ etiqueta, valor, min, max, paso = 1, formato = (v) => v, onChange }) {
  const cambiar = (delta) => onChange(Math.min(max, Math.max(min, valor + delta)));

  return (
    <div className="space-y-1">
      <span className="block text-xs text-slate-400">{etiqueta}</span>
      <div className="flex h-11 items-center rounded-xl border border-borde bg-fondo">
        <button
          type="button"
          onClick={() => cambiar(-paso)}
          disabled={valor <= min}
          aria-label={`Bajar ${etiqueta}`}
          className="h-full w-11 text-xl text-slate-300 disabled:opacity-30"
        >
          −
        </button>
        <span className="flex-1 text-center font-mono font-semibold" aria-live="polite">
          {formato(valor)}
        </span>
        <button
          type="button"
          onClick={() => cambiar(paso)}
          disabled={valor >= max}
          aria-label={`Subir ${etiqueta}`}
          className="h-full w-11 text-xl text-slate-300 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}