export default function Campo({ etiqueta, id, ...props }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {etiqueta}
      </label>
      <input
        id={id}
        className="h-12 w-full rounded-xl border border-borde bg-fondo px-3.5 text-base text-slate-100
                   placeholder:text-slate-500 outline-none transition
                   focus:border-primario focus:ring-2 focus:ring-primario/30"
        {...props}
      />
    </div>
  );
}