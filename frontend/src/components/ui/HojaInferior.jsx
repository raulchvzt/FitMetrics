import { useId } from 'react';

export default function HojaInferior({ titulo, onCerrar, children }) {
  const idTitulo = useId();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="sin-presion absolute inset-0 animate-velo bg-black/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="relative w-full max-w-md animate-hoja space-y-4 rounded-t-[28px] border-t border-borde bg-superficie
                   px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-neutral-700" aria-hidden="true" />
        <h2 id={idTitulo} className="text-xl font-extrabold tracking-tight">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}