import { useState } from 'react';
import { fotosDeEjercicio } from '../utils/imagenEjercicio';
import Icono from './ui/Icono';

// Primera foto del ejercicio, o un ícono si no tiene (o si no carga)
export default function MiniaturaEjercicio({ ejercicio, className = 'h-14 w-14 rounded-2xl' }) {
  const [primera] = fotosDeEjercicio(ejercicio);
  const [fallida, setFallida] = useState(null);

  if (!primera || primera === fallida) {
    return (
      <span aria-hidden="true" className={`flex shrink-0 items-center justify-center bg-elevado text-neutral-500 ${className}`}>
        <Icono nombre="entrenar" className="h-6 w-6" />
      </span>
    );
  }
  return (
    <img
      src={primera}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFallida(primera)}
      className={`shrink-0 bg-elevado object-cover ${className}`}
    />
  );
}
