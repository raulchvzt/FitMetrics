import { useState } from 'react';
import Icono from './ui/Icono';
import FormularioEjercicio from './FormularioEjercicio';
import MiniaturaEjercicio from './MiniaturaEjercicio';
import { agruparPorSeccion } from '../utils/seccionesEjercicio';

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function Ejercicio({ ejercicio, agregado, onElegir, onEditar }) {
  const musculos = [...ejercicio.musculos]
    .sort((a, b) => Number(b.factor) - Number(a.factor))
    .map((m) => m.nombre)
    .join(', ');

  return (
    <li className="relative">
      <button
        type="button"
        onClick={() => onElegir(ejercicio)}
        disabled={agregado}
        className={`flex w-full items-center gap-3 rounded-3xl bg-superficie p-2 pr-4 text-left transition
                   hover:bg-elevado disabled:cursor-not-allowed disabled:opacity-50 ${ejercicio.propio ? 'pr-16' : ''}`}
      >
        <MiniaturaEjercicio ejercicio={ejercicio} className="h-16 w-16 rounded-2xl" />
        <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold">{ejercicio.nombre}</span>
          {ejercicio.propio && (
            <span className="rounded-full bg-primario/15 px-2 py-0.5 text-[11px] font-bold text-primario">Tuyo</span>
          )}
          {agregado && (
            <span className="rounded-full bg-elevado px-2.5 py-0.5 text-xs font-semibold text-neutral-300">
              Agregado
            </span>
          )}
        </span>
        <span className="block text-sm text-neutral-400">
          {ejercicio.equipo && <>{ejercicio.equipo} · </>}
          {musculos}
        </span>
        </span>
      </button>
      {ejercicio.propio && (
        <button
          type="button"
          onClick={() => onEditar(ejercicio)}
          aria-label={`Editar ${ejercicio.nombre}`}
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full
                     bg-elevado text-neutral-300 transition hover:text-neutral-50"
        >
          <Icono nombre="editar" className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

export default function SelectorEjercicio({ catalogo, yaAgregados, onElegir, onCerrar, onCatalogoCambio }) {
  const [busqueda, setBusqueda] = useState('');
  const [seccion, setSeccion] = useState('todos');
  // null = cerrado; { ejercicio: null } = crear; { ejercicio } = editar uno propio
  const [formulario, setFormulario] = useState(null);

  function creado(nuevo) {
    onCatalogoCambio([...catalogo, nuevo]);
    setFormulario(null);
    onElegir(nuevo); // se agrega directo a la rutina
  }

  function actualizado(cambiado) {
    onCatalogoCambio(catalogo.map((e) => (e.id === cambiado.id ? cambiado : e)));
    setFormulario(null);
  }

  function eliminado(borrado) {
    onCatalogoCambio(catalogo.filter((e) => e.id !== borrado.id));
    setFormulario(null);
  }

  if (formulario) {
    return (
      <FormularioEjercicio
        ejercicio={formulario.ejercicio}
        nombreSugerido={busqueda.trim()}
        onGuardado={formulario.ejercicio ? actualizado : creado}
        onEliminado={eliminado}
        onCerrar={() => setFormulario(null)}
      />
    );
  }
  const texto = normalizar(busqueda.trim());

  const encontrados = catalogo.filter((e) =>
    normalizar(e.nombre).includes(texto) ||
    normalizar(e.equipo ?? '').includes(texto) ||
    e.musculos.some((m) => normalizar(m.nombre).includes(texto))
  );
  const grupos = agruparPorSeccion(encontrados);
  const visibles = seccion === 'todos' ? grupos : grupos.filter((g) => g.id === seccion);
  // Si la búsqueda deja vacía la sección elegida, se muestra "Todos" para no perder resultados
  const seccionActiva = seccion !== 'todos' && visibles.length === 0 && encontrados.length > 0 ? 'todos' : seccion;
  const lista = seccionActiva === 'todos' ? grupos : visibles;

  const chips = [
    { id: 'todos', etiqueta: 'Todos', total: encontrados.length },
    ...grupos.map((g) => ({ id: g.id, etiqueta: g.etiqueta, total: g.ejercicios.length }))
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-selector"
      className="fixed inset-0 z-30 flex flex-col bg-fondo"
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden pt-6">
        <div className="mb-4 flex items-center justify-between px-5">
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

        <div className="px-5">
          <label className="mb-3 flex h-13 items-center gap-2 rounded-full border border-borde bg-superficie px-4
                            focus-within:border-primario focus-within:ring-2 focus-within:ring-primario/25">
            <Icono nombre="buscar" className="h-5 w-5 text-neutral-400" />
            <span className="sr-only">Buscar ejercicio, músculo o equipo</span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio, músculo o equipo"
              className="w-full bg-transparent text-base outline-none placeholder:text-neutral-500"
            />
          </label>
        </div>

        {/* Secciones: se desliza de lado en el teléfono */}
        <div
          role="group"
          aria-label="Sección"
          className="flex shrink-0 gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={seccionActiva === c.id}
              onClick={(evento) => {
                setSeccion(c.id);
                evento.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition
                ${seccionActiva === c.id
                  ? 'bg-primario text-sobre-primario'
                  : 'bg-superficie text-neutral-300 hover:bg-elevado'}`}
            >
              {c.etiqueta}
              <span className={`font-mono text-xs ${seccionActiva === c.id ? 'opacity-70' : 'text-neutral-500'}`}>
                {c.total}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setFormulario({ ejercicio: null })}
            className="mb-2 mt-1 flex h-13 w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-neutral-700
                       text-sm font-bold text-neutral-300 transition hover:border-primario hover:text-neutral-50"
          >
            <Icono nombre="mas" className="h-5 w-5" />
            {texto && encontrados.length === 0 ? `Crear "${busqueda.trim()}"` : 'Crear ejercicio'}
          </button>

          {lista.map((g) => (
            <section key={g.id} aria-labelledby={`seccion-${g.id}`} className="mb-4">
              <h3
                id={`seccion-${g.id}`}
                className="sticky top-0 z-10 bg-fondo py-2 text-sm font-bold text-neutral-400"
              >
                {g.etiqueta}
              </h3>
              <ul className="space-y-2">
                {g.ejercicios.map((e) => (
                  <Ejercicio
                    key={e.id}
                    ejercicio={e}
                    agregado={yaAgregados.includes(e.id)}
                    onElegir={onElegir}
                    onEditar={(ejercicio) => setFormulario({ ejercicio })}
                  />
                ))}
              </ul>
            </section>
          ))}
          {encontrados.length === 0 && (
            <p className="py-6 text-center text-sm text-neutral-400">Sin resultados para "{busqueda}"</p>
          )}
        </div>
      </div>
    </div>
  );
}
