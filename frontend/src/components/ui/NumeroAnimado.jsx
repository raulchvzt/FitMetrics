import { useEffect, useRef, useState } from 'react';

const sinMovimiento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Frena al final, como los contadores de las apps de iOS
const frenar = (t) => 1 - (1 - t) ** 3;

// Cuenta desde el valor anterior (o desde 0 la primera vez) hasta el nuevo
export default function NumeroAnimado({ valor, formato = (v) => Math.round(v), duracion = 700 }) {
  const [mostrado, setMostrado] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    if (sinMovimiento()) {
      anterior.current = valor;
      return undefined;
    }

    const desde = anterior.current;
    let inicio = null;
    let cuadro = requestAnimationFrame(function paso(ahora) {
      inicio ??= ahora;
      const avance = Math.min((ahora - inicio) / duracion, 1);
      const actual = desde + (valor - desde) * frenar(avance);
      anterior.current = actual;
      setMostrado(actual);
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    });

    return () => cancelAnimationFrame(cuadro);
  }, [valor, duracion]);

  // Con "Reducir movimiento" se muestra directo el valor final
  return formato(sinMovimiento() ? valor : mostrado);
}
