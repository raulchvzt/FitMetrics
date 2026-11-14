export default function Campo({ etiqueta, id, ...props }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-neutral-300">
        {etiqueta}
      </label>
      <input
        id={id}
        className="h-13 w-full rounded-2xl border border-borde bg-superficie px-4 text-base text-neutral-50
                   placeholder:text-neutral-500 outline-none transition
                   focus:border-primario focus:ring-2 focus:ring-primario/25"
        {...props}
      />
    </div>
  );
}
