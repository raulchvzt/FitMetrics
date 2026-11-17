import { useState } from 'react';
import Icono from './Icono';

const ESTILO_INPUT = `h-13 w-full rounded-2xl border border-borde bg-superficie px-4 text-base text-neutral-50
                      placeholder:text-neutral-500 outline-none transition
                      focus:border-primario focus:ring-2 focus:ring-primario/25`;

export default function Campo({ etiqueta, id, type, ...props }) {
  const esPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-neutral-300">
        {etiqueta}
      </label>

      {esPassword ? (
        <div className="relative">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            className={`${ESTILO_INPUT} pr-14`}
            {...props}
          />
          {/* Botón de la pesa: muestra u oculta la contraseña */}
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            // Evita que el campo pierda el foco: así el teclado del iPhone no se cierra
            onPointerDown={(e) => e.preventDefault()}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            aria-controls={id}
            className={`absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full transition
              ${visible ? 'bg-primario/15 text-primario' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            <Icono nombre="entrenar" className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <input id={id} type={type} className={ESTILO_INPUT} {...props} />
      )}
    </div>
  );
}
