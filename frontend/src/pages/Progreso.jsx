import { useSearchParams } from 'react-router-dom';
import VolumenSemanal from '../components/progreso/VolumenSemanal';
import FuerzaEjercicio from '../components/progreso/FuerzaEjercicio';

const VISTAS = [
  { id: 'volumen', etiqueta: 'Volumen' },
  { id: 'fuerza', etiqueta: 'Fuerza' }
];

export default function Progreso() {
  const [parametros, setParametros] = useSearchParams();
  const vista = parametros.get('vista') === 'fuerza' ? 'fuerza' : 'volumen';

  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-extrabold tracking-tight">Progreso</h1>

      <div role="tablist" aria-label="Tipo de progreso" className="grid grid-cols-2 gap-1 rounded-full bg-superficie p-1">
        {VISTAS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={vista === v.id}
            onClick={() => setParametros(v.id === 'volumen' ? {} : { vista: v.id }, { replace: true })}
            className={`h-10 rounded-full text-sm font-extrabold transition
              ${vista === v.id ? 'bg-primario text-fondo' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            {v.etiqueta}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {vista === 'volumen' ? <VolumenSemanal /> : <FuerzaEjercicio />}
      </div>
    </div>
  );
}