const variantes = {
  primario: 'bg-primario text-white hover:bg-blue-500',
  secundario: 'border border-borde text-slate-200 hover:bg-superficie',
  peligro: 'bg-red-600 text-white hover:bg-red-700'
};

export default function Boton({ variante = 'primario', cargando = false, className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 font-semibold
                  transition disabled:cursor-not-allowed disabled:opacity-60
                  ${variantes[variante]} ${className}`}
      disabled={cargando || props.disabled}
      {...props}
    >
      {cargando ? 'Cargando…' : children}
    </button>
  );
}