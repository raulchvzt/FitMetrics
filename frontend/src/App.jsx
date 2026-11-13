import { useEffect, useState } from 'react';
import { api } from './services/api';

export default function App() {
  const [estado, setEstado] = useState('Conectando…');
  const [ejercicios, setEjercicios] = useState([]);

  useEffect(() => {
    api('/health')
      .then((r) => setEstado(`Conectado a ${r.baseDatos}`))
      .catch((err) => setEstado(err.message));

    api('/ejercicios')
      .then(setEjercicios)
      .catch(() => setEjercicios([]));
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-3xl font-bold">Fit<span className="text-blue-400">Metrics</span></h1>
      <p className="rounded-xl border border-borde bg-superficie p-4 font-mono text-sm">{estado}</p>

      <ul className="space-y-2">
        {ejercicios.map((e) => (
          <li key={e.id} className="rounded-xl border border-borde bg-superficie p-3">
            <p className="font-semibold">{e.nombre}</p>
            <p className="text-sm text-slate-400">
              {e.musculos.map((m) => `${m.nombre} (${m.factor})`).join(' · ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}