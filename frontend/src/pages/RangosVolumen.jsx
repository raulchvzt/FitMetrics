import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Boton from '../components/ui/Boton';
import Contador from '../components/ui/Contador';
import Icono from '../components/ui/Icono';

const LIMITE = 40;

export default function RangosVolumen() {
  const navigate = useNavigate();

  const [porDefecto, setPorDefecto] = useState(null);
  const [originales, setOriginales] = useState([]);
  const [musculos, setMusculos] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmarRestablecer, setConfirmarRestablecer] = useState(false);

  function cargar(respuesta) {
    setPorDefecto(respuesta.porDefecto);
    setOriginales(respuesta.musculos);
    setMusculos(respuesta.musculos);
  }

  useEffect(() => {
    api('/progreso/objetivos')
      .then(cargar)
      .catch((err) => setError(err.message));
  }, []);

  function actualizar(grupoMuscularId, campo, valor) {
    setMusculos((lista) =>
      lista.map((m) => {
        if (m.grupoMuscularId !== grupoMuscularId) return m;
        const nuevo = { ...m, [campo]: valor };
        if (campo === 'minimo' && valor > nuevo.maximo) nuevo.maximo = valor;
        if (campo === 'maximo' && valor < nuevo.minimo) nuevo.minimo = valor;
        return nuevo;
      })
    );
  }

  const cambiados = (musculos ?? []).filter((m, i) =>
    m.minimo !== originales[i].minimo || m.maximo !== originales[i].maximo
  );

  async function guardar() {
    setError('');
    setGuardando(true);
    try {
      await api('/progreso/objetivos', {
        method: 'PUT',
        body: {
          objetivos: cambiados.map(({ grupoMuscularId, minimo, maximo }) => ({ grupoMuscularId, minimo, maximo }))
        }
      });
      navigate('/progreso?vista=volumen');
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  async function restablecer() {
    setError('');
    setGuardando(true);
    try {
      cargar(await api('/progreso/objetivos', { method: 'DELETE' }));
      setConfirmarRestablecer(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const esDefecto = (m) => m.minimo === porDefecto.minimo && m.maximo === porDefecto.maximo;

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link
          to="/progreso?vista=volumen"
          aria-label="Volver a progreso"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
        >
          <Icono nombre="atras" className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Rangos de volumen</h1>
          <p className="text-sm text-neutral-400">Series efectivas por semana</p>
        </div>
      </header>

      <p className="rounded-3xl bg-superficie px-4 py-3 text-sm leading-relaxed text-neutral-300">
        Son referencias, no reglas: ajústalas a tu nivel, tus objetivos y cómo te recuperas.
        {porDefecto && ` Si no cambias un músculo, se usa ${porDefecto.minimo}–${porDefecto.maximo}.`}
      </p>

      {error && (
        <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!musculos ? (
        !error && <p className="text-neutral-400">Cargando…</p>
      ) : (
        <>
          <ul className="space-y-3">
            {musculos.map((m) => (
              <li key={m.grupoMuscularId}>
                <fieldset className="space-y-3 rounded-3xl bg-superficie p-4">
                  <legend className="sr-only">{m.musculo}</legend>
                  <div className="flex items-center justify-between gap-2" aria-hidden="true">
                    <span className="font-bold">{m.musculo}</span>
                    {!esDefecto(m) && (
                      <span className="rounded-full bg-primario/15 px-2.5 py-0.5 text-xs font-bold text-primario">
                        Personalizado
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Contador etiqueta="Mínimo" valor={m.minimo} min={0} max={LIMITE}
                              onChange={(v) => actualizar(m.grupoMuscularId, 'minimo', v)} />
                    <Contador etiqueta="Máximo" valor={m.maximo} min={1} max={LIMITE}
                              onChange={(v) => actualizar(m.grupoMuscularId, 'maximo', v)} />
                  </div>
                </fieldset>
              </li>
            ))}
          </ul>

          {cambiados.length > 0 && (
            <div className="sticky bottom-[calc(6rem+env(safe-area-inset-bottom))] z-10">
              <Boton onClick={guardar} cargando={guardando} className="w-full shadow-lg shadow-sombra/60">
                Guardar {cambiados.length === 1 ? '1 cambio' : `${cambiados.length} cambios`}
              </Boton>
            </div>
          )}

          {confirmarRestablecer ? (
            <div className="space-y-3 rounded-3xl border border-peligro/40 bg-peligro/10 p-4">
              <p className="text-sm text-neutral-200">
                Todos los músculos volverán a {porDefecto.minimo}–{porDefecto.maximo}.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Boton variante="secundario" onClick={() => setConfirmarRestablecer(false)} disabled={guardando}>
                  Cancelar
                </Boton>
                <Boton variante="peligro" onClick={restablecer} cargando={guardando}>
                  Restablecer
                </Boton>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarRestablecer(true)}
              className="h-12 w-full rounded-full text-sm font-semibold text-neutral-400 transition hover:bg-superficie hover:text-neutral-100"
            >
              Restablecer todos a {porDefecto.minimo}–{porDefecto.maximo}
            </button>
          )}
        </>
      )}
    </div>
  );
}