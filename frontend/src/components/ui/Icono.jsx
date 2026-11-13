const trazos = {
  inicio: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  rutinas: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  entrenar: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  progreso: 'M5 20V11M12 20V4M19 20v-6M3 20h18',
  suplementos: 'M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l7 7',
  mas: 'M12 5v14M5 12h14',
  flecha: 'M9 6l6 6-6 6',
};

export default function Icono({ nombre, className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={trazos[nombre]} />
    </svg>
  );
}