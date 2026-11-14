import { useEffect, useState } from 'react';
import { formatoDuracion } from '../utils/formato';

export default function Cronometro({ segundosIniciales }) {
  const [segundos, setSegundos] = useState(segundosIniciales);

  useEffect(() => {
    const inicio = Date.now() - segundosIniciales * 1000;
    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [segundosIniciales]);

  return <span className="tabular-nums">{formatoDuracion(segundos)}</span>;
}