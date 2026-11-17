import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { formatoFechaHora } from '../utils/formato';
import { FRECUENCIAS, MOMENTOS, UNIDADES, formatoCantidad, limpiarDecimal } from '../utils/suplementos';
import Boton from '../components/ui/Boton';
import Campo from '../components/ui/Campo';
import Contador from '../components/ui/Contador';
import Icono from '../components/ui/Icono';

const VACIO = {
  nombre: '',
  unidad: 'g',
  dosis: '',
  frecuencia: 'Diario',
  momento: 'Cualquiera',
  horaRecordatorio: '',
  presentacion: '',
  stock: '',
  diasAlerta: 7
};

const ETIQUETAS_CORTAS = { Cualquiera: 'Cualquiera', AntesEntrenar: 'Antes', DespuesEntrenar: 'Después' };

const TIPOS_MOVIMIENTO = { Compra: 'Compra', Consumo: 'Toma', Ajuste: 'Ajuste' };

function Opciones({ etiqueta, opciones, valor, onCambiar, columnas = 2 }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-semibold text-neutral-300">{etiqueta}</legend>
      <div className={`grid gap-1 rounded-3xl bg-superficie p-1 ${columnas === 3 ? 'grid-cols-3' : columnas === 5 ? 'grid-cols-5' : 'grid-cols-2'}`}>
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            aria-pressed={valor === o.valor}
            onClick={() => onCambiar(o.valor)}
            className={`min-h-11 rounded-full px-2 text-sm font-bold leading-tight transition
              ${valor === o.valor ? 'bg-primario text-sobre-primario' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            {o.etiqueta}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function CampoDecimal({ etiqueta, id, valor, onCambiar, ...props }) {
  return (
    <Campo
      etiqueta={etiqueta}
      id={id}
      type="text"
      inputMode="decimal"
      value={valor}
      onChange={(e) => {
        const limpio = limpiarDecimal(e.target.value);
        if (limpio !== null) onCambiar(limpio);
      }}
      {...props}
    />
  );
}

function Inventario({ suplemento, onActualizado }) {
  const [stock, setStock] = useState(String(suplemento.stock));
  const [movimientos, setMovimientos] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api(`/suplementos/${suplemento.id}/movimientos`)
      .then(setMovimientos)
      .catch((err) => setError(err.message));
  }, [suplemento.id, suplemento.stock]);

  async function corregir() {
    setError('');
    setGuardando(true);
    try {
      onActualizado(await api(`/suplementos/${suplemento.id}/stock`, { method: 'PUT', body: { stock: Number(stock) } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  const cambio = stock !== '' && Number(stock) !== suplemento.stock;

  return (
    <section className="space-y-4 border-t border-borde pt-5">
      <h2 className="text-lg font-extrabold">Inventario</h2>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <CampoDecimal etiqueta={`Stock actual (${suplemento.unidad})`} id="stock-actual" valor={stock} onCambiar={setStock} />
        </div>
        <Boton variante="secundario" onClick={corregir} cargando={guardando} disabled={!cambio}>
          Corregir
        </Boton>
      </div>
      <p className="text-xs text-neutral-400">
        Úsalo si contaste lo que te queda y no coincide. Para sumar una compra, usa "+ Compra" en la lista.
      </p>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-neutral-400">Últimos movimientos</h3>
        {!movimientos ? (
          <p className="text-sm text-neutral-400">Cargando…</p>
        ) : movimientos.length === 0 ? (
          <p className="text-sm text-neutral-400">Sin movimientos todavía.</p>
        ) : (
          <ul className="divide-y divide-borde rounded-3xl bg-superficie px-4">
            {movimientos.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{TIPOS_MOVIMIENTO[m.tipo]}</p>
                  <p className="text-xs text-neutral-400">{formatoFechaHora(m.fecha)}</p>
                </div>
                <span className={`shrink-0 font-mono text-sm font-bold ${m.cantidad > 0 ? 'text-primario' : 'text-neutral-300'}`}>
                  {m.cantidad > 0 ? '+' : '−'}{formatoCantidad(Math.abs(m.cantidad), suplemento.unidad)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function SuplementoEditor() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const idHora = useId();

  const [form, setForm] = useState(VACIO);
  const [suplemento, setSuplemento] = useState(null);
  const [cargando, setCargando] = useState(esEdicion);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  useEffect(() => {
    if (!id) return;
    let activo = true;
    api(`/suplementos/${id}`)
      .then((s) => {
        if (!activo) return;
        setSuplemento(s);
        setForm({
          ...VACIO,
          nombre: s.nombre,
          unidad: s.unidad,
          dosis: String(s.dosis),
          frecuencia: s.frecuencia,
          momento: s.momento,
          horaRecordatorio: s.horaRecordatorio ?? '',
          presentacion: s.presentacion === null ? '' : String(s.presentacion),
          diasAlerta: s.diasAlerta
        });
      })
      .catch((err) => {
        if (activo) setError(err.status === 404 ? 'Suplemento no encontrado' : err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  const cambiar = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function guardar(e) {
    e.preventDefault();
    setError('');

    if (!form.nombre.trim()) return setError('Ponle un nombre al suplemento');
    if (!(Number(form.dosis) > 0)) return setError('Escribe la dosis de cada toma');

    const datos = {
      nombre: form.nombre,
      unidad: form.unidad,
      dosis: Number(form.dosis),
      frecuencia: form.frecuencia,
      momento: form.momento,
      horaRecordatorio: form.horaRecordatorio || null,
      presentacion: form.presentacion ? Number(form.presentacion) : null,
      diasAlerta: form.diasAlerta,
      ...(!esEdicion && { stock: form.stock ? Number(form.stock) : 0 })
    };

    setGuardando(true);
    try {
      if (esEdicion) await api(`/suplementos/${id}`, { method: 'PUT', body: datos });
      else await api('/suplementos', { method: 'POST', body: datos });
      navigate('/suplementos');
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  async function eliminar() {
    setGuardando(true);
    try {
      await api(`/suplementos/${id}`, { method: 'DELETE' });
      navigate('/suplementos', { replace: true });
    } catch (err) {
      setError(err.message);
      setGuardando(false);
      setConfirmarEliminar(false);
    }
  }

  const volver = (
    <Link
      to="/suplementos"
      aria-label="Volver a suplementos"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
    >
      <Icono nombre="atras" className="h-5 w-5" />
    </Link>
  );

  if (cargando) return <p className="text-neutral-400">Cargando…</p>;

  if (esEdicion && !suplemento) {
    return (
      <div className="space-y-4">
        {volver}
        <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        {volver}
        <h1 className="text-2xl font-extrabold tracking-tight">{esEdicion ? 'Editar suplemento' : 'Nuevo suplemento'}</h1>
      </header>

      <form onSubmit={guardar} className="space-y-5">
        <Campo etiqueta="Nombre" id="nombre" value={form.nombre} maxLength={100}
               onChange={(e) => cambiar('nombre')(e.target.value)} placeholder="Ej. Creatina" required />

        <Opciones etiqueta="Unidad" columnas={5} valor={form.unidad} onCambiar={cambiar('unidad')}
                  opciones={UNIDADES.map((u) => ({ valor: u, etiqueta: u === 'cápsula' ? 'cáps.' : u === 'tableta' ? 'tab.' : u }))} />

        <div className="grid grid-cols-2 gap-3">
          <CampoDecimal etiqueta={`Dosis (${form.unidad})`} id="dosis" valor={form.dosis}
                        onCambiar={cambiar('dosis')} placeholder="5" />
          <CampoDecimal etiqueta={`Envase (${form.unidad})`} id="presentacion" valor={form.presentacion}
                        onCambiar={cambiar('presentacion')} placeholder="Opcional" />
        </div>

        {!esEdicion && (
          <CampoDecimal etiqueta={`¿Cuánto tienes ahora? (${form.unidad})`} id="stock" valor={form.stock}
                        onCambiar={cambiar('stock')} placeholder="0" />
        )}

        <Opciones etiqueta="¿Cuándo lo tomas?" valor={form.frecuencia} onCambiar={cambiar('frecuencia')}
                  opciones={FRECUENCIAS} />

        <Opciones etiqueta="Momento" columnas={3} valor={form.momento} onCambiar={cambiar('momento')}
                  opciones={MOMENTOS.map((m) => ({ ...m, etiqueta: ETIQUETAS_CORTAS[m.valor] }))} />

        <div className="grid grid-cols-2 items-end gap-3">
          <Contador etiqueta="Avisar con (días)" valor={form.diasAlerta} min={0} max={60}
                    onChange={cambiar('diasAlerta')} />
          <div className="space-y-1">
            <label htmlFor={idHora} className="block text-xs text-neutral-400">Hora de recordatorio</label>
            <input
              id={idHora}
              type="time"
              value={form.horaRecordatorio}
              onChange={(e) => cambiar('horaRecordatorio')(e.target.value)}
              className="h-12 w-full rounded-full border border-borde bg-superficie px-4 font-mono text-base outline-none
                         [color-scheme:dark] focus:border-primario focus:ring-2 focus:ring-primario/25"
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-neutral-400">
          Te avisaremos cuando te queden esos días o menos. La hora se usará para notificaciones en días de descanso.
        </p>

        {error && (
          <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <Boton type="submit" cargando={guardando} className="w-full">
          {esEdicion ? 'Guardar cambios' : 'Agregar suplemento'}
        </Boton>
      </form>

      {esEdicion && (
        <>
          <Inventario suplemento={suplemento} onActualizado={setSuplemento} />

          <section className="border-t border-borde pt-5">
            {confirmarEliminar ? (
              <div className="space-y-3 rounded-3xl border border-peligro/40 bg-peligro/10 p-4">
                <p className="text-sm text-neutral-200">
                  ¿Eliminar {suplemento.nombre}? Dejará de aparecer, pero su historial se conserva.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Boton variante="secundario" onClick={() => setConfirmarEliminar(false)} disabled={guardando}>
                    Cancelar
                  </Boton>
                  <Boton variante="peligro" onClick={eliminar} cargando={guardando}>Sí, eliminar</Boton>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarEliminar(true)}
                className="h-13 w-full rounded-full border border-peligro/40 text-sm font-bold text-red-300 transition hover:bg-peligro/10"
              >
                Eliminar suplemento
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}