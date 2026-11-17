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
  editar: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  sol: 'M12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  luna: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  trofeo: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5.5a2.5 2.5 0 0 0 2.5 4M16 6h2.5a2.5 2.5 0 0 1-2.5 4M12 13v4M9 20h6M10 17h4v3h-4z',
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