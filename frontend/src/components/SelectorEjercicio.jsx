import { useState } from 'react';
import Icono from './ui/Icono';

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function SelectorEjercicio({ catalogo, yaAgregados, onElegir, onCerrar }) {
  const [busqueda, setBusqueda] = useState('');
  const texto = normalizar(busqueda.trim());

  const filtrados = catalogo.filter((e) =>
    normalizar(e.nombre).includes(texto) ||
    e.musculos.some((m) => normalizar(m.nombre).includes(texto))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-selector"
      className="fixed inset-0 z-30 flex flex-col bg-fondo"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden px-5 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="titulo-selector" className="text-2xl font-extrabold tracking-tight">Elegir ejercicio</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
          >
            <Icono nombre="cerrar" className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-4 flex h-13 items-center gap-2 rounded-full border border-borde bg-superficie px-4
                          focus-within:border-primario focus-within:ring-2 focus-within:ring-primario/25">
          <Icono nombre="buscar" className="h-5 w-5 text-neutral-400" />
          <span className="sr-only">Buscar ejercicio o músculo</span>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar ejercicio o músculo"
            autoFocus
            className="w-full bg-transparent text-base outline-none placeholder:text-neutral-500"
          />
        </label>

        <ul className="flex-1 space-y-2 overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {filtrados.map((e) => {
            const agregado = yaAgregados.includes(e.id);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onElegir(e)}
                  disabled={agregado}
                  className="w-full rounded-3xl bg-superficie px-4 py-3 text-left transition
                             hover:bg-elevado disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-bold">{e.nombre}</span>
                    {agregado && (
                      <span className="rounded-full bg-elevado px-2.5 py-0.5 text-xs font-semibold text-neutral-300">
                        Agregado
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-neutral-400">
                    {e.musculos.map((m) => m.nombre).join(' · ')}
                  </span>
                </button>
              </li>
            );
          })}
          {filtrados.length === 0 && (
            <li className="py-6 text-center text-sm text-neutral-400">Sin resultados para "{busqueda}"</li>
          )}
        </ul>
      </div>
    </div>
  );
}