const trazos = {
  inicio: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  rutinas: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  entrenar: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  progreso: 'M5 20V11M12 20V4M19 20v-6M3 20h18',
  suplementos: 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l7 7',
  mas: 'M12 5v14M5 12h14',
  flecha: 'M9 6l6 6-6 6',
  arriba: 'M6 15l6-6 6 6',
  abajo: 'M6 9l6 6 6-6',
  cerrar: 'M6 6l12 12M18 6L6 18',
  atras: 'M15 6l-6 6 6 6',
  buscar: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  avanzar: 'M5 12h14M13 6l6 6-6 6',
  play: 'M8 5.5v13l10.5-6.5z',
  descargar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  camara: 'M4 8h3l2-3h6l2 3h3v11H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  salir: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
  candado: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
};

const rellenos = new Set(['play']);

export default function Icono({ nombre, className = 'h-6 w-6' }) {
  const relleno = rellenos.has(nombre);
  return (
    <svg viewBox="0 0 24 24" fill={relleno ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={trazos[nombre]} />
    </svg>
  );
}