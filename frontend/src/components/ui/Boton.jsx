const variantes = {
  primario: 'bg-primario text-sobre-primario hover:bg-primario-claro',
  secundario: 'bg-elevado text-neutral-50 hover:bg-neutral-800',
  peligro: 'bg-red-600 text-white hover:bg-red-700'
};

export default function Boton({ variante = 'primario', cargando = false, className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex h-13 items-center justify-center gap-2 rounded-full px-6 font-bold
                  transition disabled:cursor-not-allowed disabled:opacity-60
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primario/60
                  ${variantes[variante]} ${className}`}
      disabled={cargando || props.disabled}
      {...props}
    >
      {cargando ? 'Cargando…' : children}
    </button>
  );
}
