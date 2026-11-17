import { useCallback, useMemo, useState } from 'react';
import { TemaContext } from './TemaContext';

const CLAVE = 'fitmetrics_tema';

// Color de la barra de estado del iPhone en cada tema
const COLOR_BARRA = { oscuro: '#0A0A0A', claro: '#F2F2EE' };

function aplicarTema(tema) {
  const raiz = document.documentElement;
  // Fundido suave solo durante el cambio
  raiz.classList.add('cambiando-tema');
  setTimeout(() => raiz.classList.remove('cambiando-tema'), 350);

  if (tema === 'claro') raiz.dataset.tema = 'claro';
  else delete raiz.dataset.tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema]);

  try { localStorage.setItem(CLAVE, tema); } catch { /* sin almacenamiento */ }
}

export function TemaProvider({ children }) {
  // index.html ya puso el tema guardado antes de cargar React (así no parpadea)
  const [tema, setTema] = useState(() => (document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro'));

  const cambiarTema = useCallback((nuevo) => {
    aplicarTema(nuevo);
    setTema(nuevo);
  }, []);

  const alternarTema = useCallback(() => {
    cambiarTema(tema === 'claro' ? 'oscuro' : 'claro');
  }, [tema, cambiarTema]);

  const valor = useMemo(() => ({ tema, cambiarTema, alternarTema }), [tema, cambiarTema, alternarTema]);

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}
