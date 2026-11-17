import { useSearchParams } from 'react-router-dom';
import ResumenGeneral from '../components/progreso/ResumenGeneral';
import VolumenSemanal from '../components/progreso/VolumenSemanal';
import FuerzaEjercicio from '../components/progreso/FuerzaEjercicio';

const VISTAS = [
  { id: 'resumen', etiqueta: 'Resumen', Componente: ResumenGeneral },
  { id: 'volumen', etiqueta: 'Volumen', Componente: VolumenSemanal },
  { id: 'fuerza', etiqueta: 'Fuerza', Componente: FuerzaEjercicio }
];

export default function Progreso() {
  const [parametros, setParametros] = useSearchParams();
  // La primera vista es la de por defecto: no necesita ?vista= en la dirección
  const vista = VISTAS.find((v) => v.id === parametros.get('vista')) ?? VISTAS[0];

  return (
    <div className="space-y-4">
      <h1 className="text-[28px] font-extrabold tracking-tight">Progreso</h1>

      <div role="tablist" aria-label="Tipo de progreso" className="grid grid-cols-3 gap-1 rounded-full bg-superficie p-1">
        {VISTAS.map((v, i) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={vista.id === v.id}
            onClick={() => setParametros(i === 0 ? {} : { vista: v.id }, { replace: true })}
            className={`h-10 rounded-full text-sm font-extrabold transition
              ${vista.id === v.id ? 'bg-primario text-fondo' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            {v.etiqueta}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        <vista.Componente />
      </div>
    </div>
  );
}