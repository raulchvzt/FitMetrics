import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Campo from '../components/ui/Campo';
import Boton from '../components/ui/Boton';
import Contador from '../components/ui/Contador';
import Icono from '../components/ui/Icono';
import SelectorEjercicio from '../components/SelectorEjercicio';

const VALORES_INICIALES = { series: 3, repsMin: 8, repsMax: 12, rir: 2, descansoSeg: 120 };

const formatoTiempo = (seg) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;

export default function RutinaEditor() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ejercicios, setEjercicios] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api('/ejercicios').then(setCatalogo).catch((err) => setError(err.message));
  }, []);

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

    setGuardando(true);
    try {
      await api('/rutinas', {
        method: 'POST',
        body: {
          nombre,
          descripcion,
          ejercicios: ejercicios.map(({ ejercicioId, series, repsMin, repsMax, rir, descansoSeg }) => ({
            ejercicioId, series, repsMin, repsMax, rir, descansoSeg
          }))
        }
      });
      navigate('/rutinas');
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <Link to="/rutinas" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
          <Icono nombre="atras" className="h-4 w-4" />
          Rutinas
        </Link>
        <h1 className="text-2xl font-bold">Nueva rutina</h1>
      </header>

      <form onSubmit={guardar} className="space-y-5">
        <div className="space-y-4">
          <Campo etiqueta="Nombre" id="nombre" value={nombre}
                 onChange={(e) => setNombre(e.target.value)}
                 placeholder="Ej. Torso A" maxLength={100} required />
          <Campo etiqueta="Descripción (opcional)" id="descripcion" value={descripcion}
                 onChange={(e) => setDescripcion(e.target.value)}
                 placeholder="Ej. Enfoque en pecho y hombro" maxLength={300} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Ejercicios ({ejercicios.length})
          </h2>

          {ejercicios.map((ej, index) => (
            <article key={ej.ejercicioId} className="space-y-3 rounded-2xl border border-borde bg-superficie p-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-500">{index + 1}</span>
                <h3 className="min-w-0 flex-1 truncate font-semibold">{ej.nombre}</h3>
                <button type="button" onClick={() => mover(index, -1)} disabled={index === 0}
                        aria-label={`Subir ${ej.nombre}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-fondo disabled:opacity-30">
                  <Icono nombre="arriba" className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => mover(index, 1)} disabled={index === ejercicios.length - 1}
                        aria-label={`Bajar ${ej.nombre}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-fondo disabled:opacity-30">
                  <Icono nombre="abajo" className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => quitar(index)}
                        aria-label={`Quitar ${ej.nombre}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-peligro/15 hover:text-red-300">
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
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed
                       border-slate-600 text-sm font-semibold text-slate-300 hover:border-slate-400"
          >
            <Icono nombre="mas" className="h-4 w-4" />
            Agregar ejercicio
          </button>
        </section>

        {error && (
          <div role="alert" className="rounded-xl border border-peligro/40 bg-peligro/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <Boton type="submit" cargando={guardando} className="w-full">Guardar rutina</Boton>
      </form>

      {selectorAbierto && (
        <SelectorEjercicio
          catalogo={catalogo}
          yaAgregados={ejercicios.map((ej) => ej.ejercicioId)}
          onElegir={agregar}
          onCerrar={() => setSelectorAbierto(false)}
        />
      )}
    </div>
  );
}