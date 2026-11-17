import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { formatoTiempo } from '../utils/formato';
import Campo from '../components/ui/Campo';
import Boton from '../components/ui/Boton';
import Contador from '../components/ui/Contador';
import Icono from '../components/ui/Icono';
import SelectorEjercicio from '../components/SelectorEjercicio';
import PortadaRutina from '../components/PortadaRutina';
import MiniaturaEjercicio from '../components/MiniaturaEjercicio';
import VerEjercicio from '../components/VerEjercicio';
import { reducirImagen } from '../utils/imagen';

const VALORES_INICIALES = { series: 3, repsMin: 8, repsMax: 12, rir: 2, descansoSeg: 120 };

export default function RutinaEditor() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ejercicios, setEjercicios] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(esEdicion);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  // Foto propia (data URL) o null = foto aleatoria. Se sube al guardar la rutina.
  const [foto, setFoto] = useState(null);
  const [fotoCambiada, setFotoCambiada] = useState(false);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const entradaFoto = useRef(null);
  const [viendo, setViendo] = useState(null);

  useEffect(() => {
    api('/ejercicios').then(setCatalogo).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!id) return;

    let activo = true;
    setCargando(true);

    api(`/rutinas/${id}`)
      .then((rutina) => {
        if (!activo) return;
        setNombre(rutina.nombre);
        setDescripcion(rutina.descripcion ?? '');
        setEjercicios(rutina.ejercicios);
        setFoto(rutina.foto ?? null);
      })
      .catch((err) => {
        if (!activo) return;
        if (err.status === 404) setNoEncontrada(true);
        else setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  function agregar(ejercicio) {
    setEjercicios((lista) => [
      ...lista,
      { ejercicioId: ejercicio.id, nombre: ejercicio.nombre, ...VALORES_INICIALES }
    ]);
    setSelectorAbierto(false);
  }

  function actualizar(index, campo, valor) {
    setEjercicios((lista) =>
      lista.map((ej, i) => {
        if (i !== index) return ej;
        const nuevo = { ...ej, [campo]: valor };
        if (campo === 'repsMin' && valor > nuevo.repsMax) nuevo.repsMax = valor;
        if (campo === 'repsMax' && valor < nuevo.repsMin) nuevo.repsMin = valor;
        return nuevo;
      })
    );
  }

  function quitar(index) {
    setEjercicios((lista) => lista.filter((_, i) => i !== index));
  }

  function mover(index, direccion) {
    setEjercicios((lista) => {
      const destino = index + direccion;
      if (destino < 0 || destino >= lista.length) return lista;
      const copia = [...lista];
      [copia[index], copia[destino]] = [copia[destino], copia[index]];
      return copia;
    });
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');

    if (!nombre.trim()) return setError('Ponle un nombre a la rutina');
    if (ejercicios.length === 0) return setError('Agrega al menos un ejercicio');

    const datos = {
      nombre,
      descripcion,
      ejercicios: ejercicios.map(({ ejercicioId, series, repsMin, repsMax, rir, descansoSeg }) => ({
        ejercicioId, series, repsMin, repsMax, rir, descansoSeg
      }))
    };

    setGuardando(true);
    let rutinaId = id;
    try {
      if (esEdicion) {
        await api(`/rutinas/${id}`, { method: 'PUT', body: datos });
      } else {
        rutinaId = (await api('/rutinas', { method: 'POST', body: datos })).id;
      }
    } catch (err) {
      setError(err.message);
      setGuardando(false);
      return;
    }

    if (fotoCambiada) {
      try {
        await (foto
          ? api(`/rutinas/${rutinaId}/foto`, { method: 'PUT', body: { foto } })
          : api(`/rutinas/${rutinaId}/foto`, { method: 'DELETE' }));
      } catch (err) {
        // La rutina sí se guardó: te deja en su editor para reintentar la foto
        setError(`La rutina se guardó, pero la foto no: ${err.message}`);
        setGuardando(false);
        if (!esEdicion) navigate(`/rutinas/${rutinaId}`, { replace: true });
        return;
      }
    }
    navigate('/rutinas');
  }

  async function elegirFoto(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;

    setError('');
    setProcesandoFoto(true);
    try {
      setFoto(await reducirImagen(archivo, { ancho: 800, alto: 450 }));
      setFotoCambiada(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoFoto(false);
    }
  }

  function usarFotoAleatoria() {
    setFoto(null);
    setFotoCambiada(true);
  }

  async function eliminar() {
    setError('');
    setEliminando(true);
    try {
      await api(`/rutinas/${id}`, { method: 'DELETE' });
      navigate('/rutinas', { replace: true });
    } catch (err) {
      setError(err.message);
      setEliminando(false);
      setConfirmarEliminar(false);
    }
  }

  const volver = (
    <Link
      to="/rutinas"
      aria-label="Volver a rutinas"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
    >
      <Icono nombre="atras" className="h-5 w-5" />
    </Link>
  );

  if (cargando) {
    return <p className="text-neutral-400">Cargando rutina…</p>;
  }

  if (noEncontrada) {
    return (
      <div className="space-y-4">
        {volver}
        <h1 className="text-2xl font-extrabold tracking-tight">Rutina no encontrada</h1>
        <p className="text-neutral-400">Puede que se haya eliminado o que la dirección sea incorrecta.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        {volver}
        <h1 className="text-2xl font-extrabold tracking-tight">{esEdicion ? 'Editar rutina' : 'Nueva rutina'}</h1>
      </header>

      <form onSubmit={guardar} className="space-y-5">
        <PortadaRutina
          rutina={{ id: esEdicion ? Number(id) : undefined, foto }}
          className={`flex h-44 flex-col justify-between rounded-3xl p-3 text-white transition-opacity
            ${procesandoFoto ? 'opacity-60' : ''}`}
        >
          <p className="self-start rounded-full bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur">
            {foto ? 'Tu foto' : esEdicion ? 'Foto aleatoria' : 'Tendrá una foto aleatoria'}
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            {foto && (
              <button
                type="button"
                onClick={usarFotoAleatoria}
                className="h-10 rounded-full bg-black/50 px-4 text-sm font-bold backdrop-blur transition hover:bg-black/70"
              >
                Usar aleatoria
              </button>
            )}
            <button
              type="button"
              onClick={() => entradaFoto.current.click()}
              disabled={procesandoFoto}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primario px-4 text-sm font-extrabold text-sobre-primario
                         transition hover:bg-primario-claro"
            >
              <Icono nombre="camara" className="h-4 w-4" />
              {procesandoFoto ? 'Procesando…' : 'Cambiar foto'}
            </button>
          </div>
          <input ref={entradaFoto} type="file" accept="image/*" onChange={elegirFoto} className="hidden" />
        </PortadaRutina>

        <div className="space-y-4">
          <Campo etiqueta="Nombre" id="nombre" value={nombre}
                 onChange={(e) => setNombre(e.target.value)}
                 placeholder="Ej. Torso A" maxLength={100} required />
          <Campo etiqueta="Descripción (opcional)" id="descripcion" value={descripcion}
                 onChange={(e) => setDescripcion(e.target.value)}
                 placeholder="Ej. Enfoque en pecho y hombro" maxLength={300} />
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">
            Ejercicios <span className="font-mono text-neutral-400">({ejercicios.length})</span>
          </h2>

          {ejercicios.map((ej, index) => (
            <article key={ej.ejercicioId} className="space-y-3 rounded-3xl bg-superficie p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViendo(catalogo.find((c) => c.id === ej.ejercicioId) ?? ej)}
                  aria-label={`Ver cómo se hace ${ej.nombre}`}
                  className="relative shrink-0 rounded-xl"
                >
                  <MiniaturaEjercicio
                    ejercicio={catalogo.find((c) => c.id === ej.ejercicioId)}
                    className="h-11 w-11 rounded-xl"
                  />
                  <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primario font-mono text-[10px] font-bold text-sobre-primario">
                    {index + 1}
                  </span>
                </button>
                <h3 className="min-w-0 flex-1 truncate font-bold">{ej.nombre}</h3>
                <button type="button" onClick={() => mover(index, -1)} disabled={index === 0}
                        aria-label={`Subir ${ej.nombre}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-elevado disabled:opacity-30">
                  <Icono nombre="arriba" className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => mover(index, 1)} disabled={index === ejercicios.length - 1}
                        aria-label={`Bajar ${ej.nombre}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-elevado disabled:opacity-30">
                  <Icono nombre="abajo" className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => quitar(index)}
                        aria-label={`Quitar ${ej.nombre}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-peligro/15 hover:text-red-300">
                  <Icono nombre="cerrar" className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Contador etiqueta="Series" valor={ej.series} min={1} max={10}
                          onChange={(v) => actualizar(index, 'series', v)} />
                <Contador etiqueta="RIR objetivo" valor={ej.rir} min={0} max={5}
                          onChange={(v) => actualizar(index, 'rir', v)} />
                <Contador etiqueta="Reps mínimas" valor={ej.repsMin} min={1} max={50}
                          onChange={(v) => actualizar(index, 'repsMin', v)} />
                <Contador etiqueta="Reps máximas" valor={ej.repsMax} min={1} max={50}
                          onChange={(v) => actualizar(index, 'repsMax', v)} />
                <div className="col-span-2">
                  <Contador etiqueta="Descanso" valor={ej.descansoSeg} min={15} max={600} paso={15}
                            formato={formatoTiempo}
                            onChange={(v) => actualizar(index, 'descansoSeg', v)} />
                </div>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={() => setSelectorAbierto(true)}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-full border border-dashed
                       border-neutral-600 text-sm font-bold text-neutral-200 transition hover:border-primario hover:text-primario"
          >
            <Icono nombre="mas" className="h-4 w-4" />
            Agregar ejercicio
          </button>
        </section>

        {error && (
          <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Boton type="submit" cargando={guardando} className="w-full">
          {esEdicion ? 'Guardar cambios' : 'Guardar rutina'}
        </Boton>
      </form>

      {esEdicion && (
        <section className="border-t border-borde pt-5">
          {confirmarEliminar ? (
            <div className="space-y-3 rounded-3xl border border-peligro/40 bg-peligro/10 p-4">
              <p className="font-semibold">¿Eliminar "{nombre}"?</p>
              <p className="text-sm text-neutral-300">
                Dejará de aparecer en tu lista, pero los entrenamientos que ya hiciste con ella se conservan en tu historial.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Boton variante="secundario" onClick={() => setConfirmarEliminar(false)} disabled={eliminando}>
                  Cancelar
                </Boton>
                <Boton variante="peligro" onClick={eliminar} cargando={eliminando}>
                  Sí, eliminar
                </Boton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarEliminar(true)}
              className="h-13 w-full rounded-full border border-peligro/40 text-sm font-bold text-red-300 transition hover:bg-peligro/10"
            >
              Eliminar rutina
            </button>
          )}
        </section>
      )}

      {viendo && <VerEjercicio ejercicio={viendo} onCerrar={() => setViendo(null)} />}

      {selectorAbierto && (
        <SelectorEjercicio
          catalogo={catalogo}
          yaAgregados={ejercicios.map((ej) => ej.ejercicioId)}
          onElegir={agregar}
          onCerrar={() => setSelectorAbierto(false)}
          onCatalogoCambio={(nuevo) => {
            setCatalogo(nuevo);
            // Lo que editaste o borraste en el catálogo también cambia en la rutina que estás armando
            setEjercicios((lista) => lista.flatMap((ej) => {
              const actual = nuevo.find((e) => e.id === ej.ejercicioId);
              return actual ? [{ ...ej, nombre: actual.nombre }] : [];
            }));
          }}
        />
      )}
    </div>
  );
}