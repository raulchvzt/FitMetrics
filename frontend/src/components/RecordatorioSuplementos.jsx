import { useState } from 'react';
import { api } from '../services/api';
import { formatoCantidad } from '../utils/suplementos';
import Icono from './ui/Icono';

function Recordatorio({ suplemento, fondo, onTomado }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function tomar() {
    setError('');
    setEnviando(true);
    try {
      onTomado(await api(`/suplementos/${suplemento.id}/tomas`, { method: 'POST' }));
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <li className={`rounded-3xl p-3 pl-4 ${fondo}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-alerta/15 text-alerta">
          <Icono nombre="suplementos" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            {suplemento.nombre} · <span className="font-mono">{formatoCantidad(suplemento.dosis, suplemento.unidad)}</span>
          </p>
          <p className="text-xs text-amber-200">¿Ya la tomaste hoy?</p>
        </div>
        <button
          type="button"
          onClick={tomar}
          disabled={enviando}
          className="h-10 shrink-0 rounded-full bg-alerta px-4 text-sm font-extrabold text-fondo transition hover:bg-amber-300 disabled:opacity-60"
        >
          {enviando ? '…' : 'Tomada'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    </li>
  );
}

// Lista de suplementos pendientes. Cuando confirmas uno, desaparece de la lista.
export default function RecordatorioSuplementos({ suplementos, onCambio, fondo = 'bg-superficie' }) {
  if (suplementos.length === 0) return null;

  return (
    <ul className="space-y-2" aria-label="Suplementos pendientes">
      {suplementos.map((s) => (
        <Recordatorio
          key={s.id}
          suplemento={s}
          fondo={fondo}
          onTomado={(actualizado) => onCambio(suplementos.filter((x) => x.id !== actualizado.id))}
        />
      ))}
    </ul>
  );
}