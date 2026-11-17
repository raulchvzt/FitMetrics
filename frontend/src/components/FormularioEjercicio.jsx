import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import Boton from './ui/Boton';
import Campo from './ui/Campo';
import Icono from './ui/Icono';
import { reducirImagen } from '../utils/imagen';

const EQUIPOS = ['Barra', 'Mancuerna', 'Máquina', 'Polea', 'Peso corporal', 'Otro'];
const INCREMENTOS = [0.5, 1, 1.25, 2, 2.5, 5];
const MAX_SECUNDARIOS = 3;

const decimal = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 });

function Chip({ activo, deshabilitado, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      disabled={deshabilitado}
      onClick={onClick}
      className={`h-10 rounded-full px-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-35
        ${activo ? 'bg-primario text-sobre-primario' : 'bg-superficie text-neutral-300 hover:bg-elevado'}`}
    >
      {children}
    </button>
  );
}

function Grupo({ titulo, ayuda, children }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-neutral-300">{titulo}</legend>
      {ayuda && <p className="-mt-1 text-xs text-neutral-400">{ayuda}</p>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function datosIniciales(ejercicio, nombreSugerido) {
  if (!ejercicio) {
    return { nombre: nombreSugerido, equipo: 'Mancuerna', incrementoKg: 2.5, principal: null, secundarios: [] };
  }
  return {
    nombre: ejercicio.nombre,
    equipo: ejercicio.equipo ?? 'Otro',
    incrementoKg: Number(ejercicio.incrementoKg),
    principal: ejercicio.musculos.find((m) => Number(m.factor) === 1)?.id ?? null,
    secundarios: ejercicio.musculos.filter((m) => Number(m.factor) !== 1).map((m) => m.id)
  };
}

// ejercicio = null para crear uno nuevo, o el ejercicio propio a editar
export default function FormularioEjercicio({ ejercicio, nombreSugerido = '', onGuardado, onEliminado, onCerrar }) {
  const editando = Boolean(ejercicio);
  const [grupos, setGrupos] = useState(null);
  const [form, setForm] = useState(() => datosIniciales(ejercicio, nombreSugerido));
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  // Foto propia: se sube después de guardar los datos
  const [foto, setFoto] = useState(ejercicio?.foto ?? null);
  const [fotoCambiada, setFotoCambiada] = useState(false);
  const entradaFoto = useRef(null);

  async function elegirFoto(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    try {
      setFoto(await reducirImagen(archivo, { ancho: 480, alto: 320 }));
      setFotoCambiada(true);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    api('/ejercicios/grupos').then(setGrupos).catch((err) => setError(err.message));
  }, []);

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError('');
  }

  function elegirPrincipal(id) {
    // Si era secundario, deja de serlo
    setForm((f) => ({ ...f, principal: id, secundarios: f.secundarios.filter((s) => s !== id) }));
    setError('');
  }

  function alternarSecundario(id) {
    setForm((f) => ({
      ...f,
      secundarios: f.secundarios.includes(id) ? f.secundarios.filter((s) => s !== id) : [...f.secundarios, id]
    }));
    setError('');
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (!form.nombre.trim()) return setError('Ponle un nombre al ejercicio');
    if (!form.principal) return setError('Elige el músculo principal que trabaja');

    setGuardando(true);
    try {
      let guardado = await api(editando ? `/ejercicios/${ejercicio.id}` : '/ejercicios', {
        method: editando ? 'PUT' : 'POST',
        body: form
      });
      if (fotoCambiada) {
        guardado = await api(`/ejercicios/${guardado.id}/foto`, foto
          ? { method: 'PUT', body: { foto } }
          : { method: 'DELETE' });
      }
      onGuardado(guardado);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  async function borrar() {
    setGuardando(true);
    try {
      await api(`/ejercicios/${ejercicio.id}`, { method: 'DELETE' });
      onEliminado(ejercicio);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
      setConfirmarBorrar(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-ejercicio"
      className="fixed inset-0 z-40 flex animate-pagina flex-col bg-fondo"
    >
      <form onSubmit={guardar} className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 pb-4 pt-6">
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Volver al selector"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
          >
            <Icono nombre="atras" className="h-5 w-5" />
          </button>
          <h2 id="titulo-ejercicio" className="text-2xl font-extrabold tracking-tight">
            {editando ? 'Editar ejercicio' : 'Nuevo ejercicio'}
          </h2>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-6">
          <div className="flex items-center gap-4">
            {foto ? (
              <img src={foto} alt="" className="h-20 w-28 shrink-0 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-20 w-28 shrink-0 items-center justify-center rounded-2xl border border-dashed border-neutral-700 text-neutral-500">
                <Icono nombre="camara" className="h-7 w-7" />
              </span>
            )}
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() => entradaFoto.current.click()}
                className="text-sm font-bold text-primario"
              >
                {foto ? 'Cambiar foto' : 'Agregar foto (opcional)'}
              </button>
              {foto && (
                <button
                  type="button"
                  onClick={() => {
                    setFoto(null);
                    setFotoCambiada(true);
                  }}
                  className="text-sm font-bold text-neutral-400"
                >
                  Quitar foto
                </button>
              )}
            </div>
            <input ref={entradaFoto} type="file" accept="image/*" onChange={elegirFoto} className="hidden" />
          </div>

          <Campo
            etiqueta="Nombre"
            id="ejercicio-nombre"
            value={form.nombre}
            maxLength={100}
            placeholder="Ej. Press en máquina convergente"
            onChange={(e) => cambiar('nombre', e.target.value)}
          />

          <Grupo titulo="Equipo">
            {EQUIPOS.map((eq) => (
              <Chip key={eq} activo={form.equipo === eq} onClick={() => cambiar('equipo', eq)}>{eq}</Chip>
            ))}
          </Grupo>

          {!grupos ? (
            !error && <p className="text-sm text-neutral-400">Cargando músculos…</p>
          ) : (
            <>
              <Grupo titulo="Músculo principal" ayuda="El que más trabaja. Define en qué sección aparece.">
                {grupos.map((g) => (
                  <Chip key={g.id} activo={form.principal === g.id} onClick={() => elegirPrincipal(g.id)}>
                    {g.nombre}
                  </Chip>
                ))}
              </Grupo>

              <Grupo
                titulo={`Músculos secundarios (${form.secundarios.length}/${MAX_SECUNDARIOS})`}
                ayuda="Opcional. Cuentan como media serie en tu volumen semanal."
              >
                {grupos.map((g) => {
                  const activo = form.secundarios.includes(g.id);
                  return (
                    <Chip
                      key={g.id}
                      activo={activo}
                      deshabilitado={g.id === form.principal || (!activo && form.secundarios.length >= MAX_SECUNDARIOS)}
                      onClick={() => alternarSecundario(g.id)}
                    >
                      {g.nombre}
                    </Chip>
                  );
                })}
              </Grupo>
            </>
          )}

          <Grupo
            titulo="Salto de peso"
            ayuda="Lo mínimo que puedes subir. Lo usa la sugerencia de sobrecarga."
          >
            {INCREMENTOS.map((inc) => (
              <Chip key={inc} activo={form.incrementoKg === inc} onClick={() => cambiar('incrementoKg', inc)}>
                <span className="font-mono">{decimal.format(inc)} kg</span>
              </Chip>
            ))}
          </Grupo>

          {editando && (
            <div className="rounded-3xl border border-peligro/30 p-4">
              {confirmarBorrar ? (
                <div className="space-y-3">
                  <p className="text-sm">¿Borrar <span className="font-bold">{ejercicio.nombre}</span>? No se puede deshacer.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Boton type="button" variante="secundario" onClick={() => setConfirmarBorrar(false)}>Cancelar</Boton>
                    <Boton type="button" variante="peligro" cargando={guardando} onClick={borrar}>Borrar</Boton>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmarBorrar(true)}
                  className="w-full text-sm font-bold text-red-300"
                >
                  Borrar ejercicio
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-borde px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {error && (
            <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <Boton type="submit" cargando={guardando && !confirmarBorrar} className="w-full">
            {editando ? 'Guardar cambios' : 'Crear y agregar'}
          </Boton>
        </div>
      </form>
    </div>
  );
}
