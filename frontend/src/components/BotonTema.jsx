import { useTema } from '../hooks/useTema';
import Icono from './ui/Icono';

// Botón chiquito para cambiar entre tema oscuro y claro
export default function BotonTema({ className = '' }) {
  const { tema, alternarTema } = useTema();
  const claro = tema === 'claro';

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={claro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      title={claro ? 'Tema oscuro' : 'Tema claro'}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50
                  transition hover:bg-elevado ${className}`}
    >
      {/* Muestra a qué tema vas a cambiar */}
      <Icono nombre={claro ? 'luna' : 'sol'} className="h-5 w-5" />
    </button>
  );
}
