import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { descripcionToma, formatoCantidad, limpiarDecimal } from '../utils/suplementos';
import { plural } from '../utils/formato';
import Boton from '../components/ui/Boton';
import Icono from '../components/ui/Icono';
import HojaInferior from '../components/ui/HojaInferior';

function Chip({ tono, children }) {
  const tonos = {
    lima: 'bg-primario/15 text-primario',
    neutro: 'bg-elevado text-neutral-300',
    ambar: 'bg-alerta/15 text-amber-300',
    rojo: 'bg-peligro/15 text-red-300'
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tonos[tono]}`}>{children}</span>;
}

function TarjetaSuplemento({ suplemento: s, ocupado, onTomar, onDeshacer, onComprar }) {
  const avance = s.presentacion ? Math.min(100, (s.stock / s.presentacion) * 100) : null;

  return (
    <article
      className={`space-y-3 rounded-3xl bg-superficie p-4 ${s.requiereReposicion ? 'ring-1 ring-alerta/50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <Link to={`/suplementos/${s.id}`} className="min-w-0 hover:underline">
          <h2 className="truncate text-lg font-extrabold">{s.nombre}</h2>
          <p className="text-sm text-neutral-400">{descripcionToma(s)}</p>
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {s.agotado ? (
            <Chip tono="rojo">Agotado</Chip>
          ) : s.tomadoHoy ? (
            <Chip tono="lima">Tomada hoy</Chip>
          ) : s.pendienteHoy ? (
            <Chip tono="neutro">Pendiente</Chip>
          ) : null}
          {s.requiereReposicion && !s.agotado && <Chip tono="ambar">Reponer</Chip>}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between font-mono text-sm">
          <span>{formatoCantidad(s.stock, s.unidad)}</span>
          <span className={s.requiereReposicion ? 'text-amber-300' : 'text-neutral-400'}>
            ~{plural(s.diasRestantes, 'día')}
          </span>
        </div>
        {avance !== null && (
          <div className="h-2 rounded-full bg-fondo" aria-hidden="true">
            <div
              className={`h-2 origin-left animate-crecer-x rounded-full transition-[width] duration-500
                ${s.requiereReposicion ? 'bg-alerta' : 'bg-primario'}`}
              style={{ width: `${avance}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {s.tomadoHoy ? (
          <button
            type="button"
            onClick={() => onDeshacer(s)}
            disabled={ocupado}
            className="h-11 flex-1 rounded-full bg-elevado text-sm font-bold text-neutral-300 transition hover:bg-neutral-700 disabled:opacity-60"
          >
            Deshacer toma
          </button>
        ) : (
          <Boton onClick={() => onTomar(s)} disabled={ocupado || s.agotado} className="h-11 flex-1 text-sm">
            Marcar como tomada
          </Boton>
        )}
        <button
          type="button"
          onClick={() => onComprar(s)}
          className="h-11 rounded-full bg-elevado px-4 text-sm font-bold transition hover:bg-neutral-700"
        >
          + Compra
        </button>
      </div>
    </article>
  );
}

function HojaCompra({ suplemento: s, onCerrar, onGuardar }) {
  const [cantidad, setCantidad] = useState(s.presentacion ? String(s.presentacion) : '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const valor = Number(cantidad);
    if (!cantidad || !(valor > 0)) {
      setError('Escribe cuánto compraste');
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(valor);
    } catch (err) {
      setError(err.message);
      setGuardando(false);
    }
  }

  return (
    <HojaInferior titulo={`Compra de ${s.nombre}`} onCerrar={onCerrar}>
      {s.presentacion && (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCantidad(String(s.presentacion * n))}
              className={`h-11 rounded-full text-sm font-bold transition
                ${Number(cantidad) === s.presentacion * n ? 'bg-primario text-fondo' : 'bg-elevado hover:bg-neutral-700'}`}
            >
              {plural(n, 'envase')}
            </button>
          ))}
        </div>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-neutral-300">Cantidad ({s.unidad})</span>
        <input
          type="text"
          inputMode="decimal"
          value={cantidad}
          onChange={(e) => {
            const limpio = limpiarDecimal(e.target.value);
            if (limpio !== null) setCantidad(limpio);
          }}
          className="h-13 w-full rounded-2xl border border-borde bg-fondo px-4 font-mono text-base outline-none
                     focus:border-primario focus:ring-2 focus:ring-primario/25"
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <Boton variante="secundario" onClick={onCerrar} disabled={guardando}>Cancelar</Boton>
        <Boton onClick={guardar} cargando={guardando}>Guardar</Boton>
      </div>
    </HojaInferior>
  );
}

export default function Suplementos() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [ocupadoId, setOcupadoId] = useState(null);
  const [comprando, setComprando] = useState(null);

  useEffect(() => {
    api('/suplementos')
      .then(setDatos)
      .catch((err) => setError(err.message));
  }, []);

  function reemplazar(actualizado) {
    setDatos((d) => ({
      ...d,
      suplementos: d.suplementos.map((s) => (s.id === actualizado.id ? actualizado : s))
    }));
  }

  async function accion(suplemento, ruta, opciones) {
    setError('');
    setOcupadoId(suplemento.id);
    try {
      reemplazar(await api(`/suplementos/${suplemento.id}${ruta}`, opciones));
    } catch (err) {
      setError(err.message);
    } finally {
      setOcupadoId(null);
    }
  }

  async function guardarCompra(cantidad) {
    reemplazar(await api(`/suplementos/${comprando.id}/compras`, { method: 'POST', body: { cantidad } }));
    setComprando(null);
  }

  const porReponer = datos?.suplementos.filter((s) => s.requiereReposicion) ?? [];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold tracking-tight">Suplementos</h1>
        <Link
          to="/suplementos/nuevo"
          aria-label="Agregar suplemento"
          title="Agregar suplemento"
          className="flex h-13 w-13 items-center justify-center rounded-full bg-primario text-fondo transition hover:bg-primario-claro"
        >
          <Icono nombre="mas" className="h-6 w-6" />
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!datos ? (
        !error && <p className="text-neutral-400">Cargando…</p>
      ) : datos.suplementos.length === 0 ? (
        <div className="space-y-3 rounded-3xl border border-dashed border-neutral-700 p-6 text-center">
          <p className="font-bold">Aún no registras suplementos</p>
          <p className="text-sm text-neutral-400">
            Agrega tu creatina, proteína o pre-workout para llevar el inventario y recibir recordatorios.
          </p>
          <Link to="/suplementos/nuevo" className="inline-flex h-12 items-center rounded-full bg-primario px-5 font-extrabold text-fondo">
            Agregar suplemento
          </Link>
        </div>
      ) : (
        <>
          {porReponer.length > 0 && (
            <p className="rounded-3xl bg-alerta/10 px-4 py-3 text-sm text-amber-200">
              <span className="font-bold">Por reponer:</span>{' '}
              {porReponer.map((s) => `${s.nombre} (~${plural(s.diasRestantes, 'día')})`).join(', ')}.
            </p>
          )}

          <div className="escalonado space-y-4">
            {datos.suplementos.map((s) => (
              <TarjetaSuplemento
              key={s.id}
              suplemento={s}
              ocupado={ocupadoId === s.id}
              onTomar={(sup) => accion(sup, '/tomas', { method: 'POST' })}
              onDeshacer={(sup) => accion(sup, '/tomas/hoy', { method: 'DELETE' })}
              onComprar={setComprando}
              />
            ))}
          </div>

          <p className="px-2 text-xs text-neutral-500">
            Los días restantes de los suplementos de días de entreno se calculan con tus últimas 4 semanas
            ({String(datos.entrenosPorSemana).replace('.', ',')} entrenamientos por semana).
          </p>
        </>
      )}

      {comprando && (
        <HojaCompra suplemento={comprando} onCerrar={() => setComprando(null)} onGuardar={guardarCompra} />
      )}
    </div>
  );
}