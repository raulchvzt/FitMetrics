import { useId } from 'react';

// Silueta de frente y de espalda con cada grupo muscular como una zona aparte.
// Solo se dibuja la mitad izquierda; la derecha es la misma figura reflejada.

// Partes del cuerpo que no son un grupo muscular (cabeza, antebrazos, rodillas…)
const BASE = {
  frente: [
    'M100 12c11 0 18 9 18 21s-7 24-18 24-18-12-18-24 7-21 18-21Z', // cabeza
    'M92 54h8v14h-8Z', // cuello
    'M80 64c6-3 13-5 20-5v9c-8 0-15 1-22 3Z', // trapecio visto de frente
    'M47 124c-3 16-6 32-7 48l9 3c3-16 6-31 9-47Z', // antebrazo
    'M40 176c-3 13-5 26-5 38l12 2c1-13 3-26 5-38Z', // antebrazo bajo
    'M35 218c-2 6-2 12 1 16 4 3 9 2 11-3 1-5 0-10-1-14Z', // mano
    'M63 112c2 24 5 50 8 76l8 3c-2-26-3-52-2-76Z', // costado
    'M71 190c3 12 11 22 29 27v-20c-11 0-21-3-29-7Z', // cadera
    'M70 296c-4 6-4 15 1 20 6 5 15 5 20-1 3-6 2-14-2-19Z', // rodilla
    'M84 318c4 22 4 44 0 66l-6 1c1-22 1-44-1-66Z', // espinilla
    'M68 386c-6 4-9 10-6 14 6 3 16 3 21-1 1-5-1-10-4-13Z' // pie
  ],
  espalda: [
    'M100 12c11 0 18 9 18 21s-7 24-18 24-18-12-18-24 7-21 18-21Z',
    'M92 54h8v8h-8Z',
    'M47 124c-3 16-6 32-7 48l9 3c3-16 6-31 9-47Z',
    'M40 176c-3 13-5 26-5 38l12 2c1-13 3-26 5-38Z',
    'M35 218c-2 6-2 12 1 16 4 3 9 2 11-3 1-5 0-10-1-14Z',
    'M78 160c-2 10-4 20-6 30 9 0 18-1 28-3v-29c-8 2-15 2-22 2Z', // zona lumbar
    'M70 298c-3 5-3 11 0 16 7 2 14 2 20-1 1-5 1-10-1-15Z', // corva
    'M70 372c1 6 3 11 6 14l7-1c1-4 1-9 0-13Z', // tobillo
    'M68 386c-6 4-9 10-6 14 6 3 16 3 21-1 1-5-1-10-4-13Z'
  ]
};

// Cada grupo muscular con su forma (un grupo puede tener varias piezas)
const MUSCULOS = {
  frente: {
    'Hombro lateral': ['M58 67c-7 4-11 11-12 19-2 12 0 24 6 34 0-14 1-28 3-40 1-5 2-9 3-13Z'],
    'Hombro anterior': ['M60.5 66.5c6-.5 11 1 15.5 3.5-6 6-10 14-12 24-2 9-6 18-11 25 1-13 2-27 4-39 1-5 2-9 3.5-13.5Z'],
    'Pecho': ['M99 73v38c-11 6-26 5-34-2-3-8-2-20 4-28 8-8 19-10 30-8Z'],
    'Bíceps': ['M51 124c-4 12-6 26-5 40 4 4 10 4 14 0 2-14 2-27-1-40-2-4-6-4-8 0Z'],
    'Abdomen': [
      'M99 117v19H81c0-6 0-12 1-18 5-1 11-1 17-1Z',
      'M99 139v18H81v-18Z',
      'M99 160v17H81l0-17Z',
      'M99 180v16c-6 2-12 1-17-3l-1-13Z'
    ],
    'Cuádriceps': ['M73 205c-8 23-10 51-6 85 7 7 18 8 25 2 4-25 6-48 4-69-9-4-17-10-23-18Z'],
    'Pantorrillas': ['M70 320c-6 20-7 42-3 63l9 2c3-22 4-44 0-65Z']
  },
  espalda: {
    'Espalda': [
      'M99 58v62c-8-8-15-20-21-34-4-7-8-13-12-17 11-4 22-8 33-11Z', // trapecio
      'M99 124v31c-9 4-18 5-26 3-4-17-7-33-9-50 0-12 1-24 3-34 3 4 7 9 10 14 6 14 13 27 22 36Z' // dorsal
    ],
    'Hombro posterior': ['M60.5 66.5c6-.5 11 1 15.5 3.5-6 6-10 14-12 24-2 9-6 18-11 25 1-13 2-27 4-39 1-5 2-9 3.5-13.5Z'],
    'Hombro lateral': ['M58 67c-7 4-11 11-12 19-2 12 0 24 6 34 0-14 1-28 3-40 1-5 2-9 3-13Z'],
    'Tríceps': ['M50 124c-4 12-5 26-4 40 4 4 10 4 14 0 2-14 2-27-1-40-3-4-7-4-9 0Z'],
    'Glúteos': ['M99 190v42c-11 6-24 4-30-6-4-11-3-24 3-34 9-3 18-4 27-2Z'],
    'Isquiotibiales': ['M70 236c-6 21-6 42-2 58 7 4 15 4 22 1 4-19 5-38 3-57-8 3-16 2-23-2Z'],
    'Pantorrillas': ['M67 316c-6 16-5 34 2 52 5 3 11 3 15-1 4-17 4-35 0-51-6-2-11-2-17 0Z']
  }
};

function Mitad({ children }) {
  return (
    <>
      <g>{children}</g>
      <g transform="translate(200 0) scale(-1 1)">{children}</g>
    </>
  );
}

/**
 * colores: { [nombreMusculo]: color CSS }  (sin color = gris)
 * seleccionado: nombre del músculo resaltado
 */
export default function MapaMuscular({ vista = 'frente', colores = {}, seleccionado, onElegir, className = '' }) {
  const musculos = MUSCULOS[vista];
  const idBrillo = `brillo-${useId().replace(/:/g, '')}`;

  return (
    <svg viewBox="28 8 144 398" className={className} role="img" aria-label={`Mapa muscular, vista de ${vista}`}>
      <defs>
        {/* Luz suave desde arriba: da volumen a cada músculo */}
        <linearGradient id={idBrillo} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <Mitad>
        {BASE[vista].map((d) => (
          <path key={d} d={d} className="fill-neutral-800" />
        ))}
      </Mitad>
      {Object.entries(musculos).map(([nombre, piezas], i) => {
        const activo = seleccionado === nombre;
        // Cada músculo se pinta un poco después del anterior: efecto de "llenado"
        const retraso = `${i * 45}ms`;
        return (
          <g
            key={nombre}
            onClick={onElegir ? () => onElegir(nombre) : undefined}
            className={onElegir ? 'cursor-pointer' : undefined}
            style={{ fill: colores[nombre] ?? 'var(--color-neutral-700)' }}
          >
            <title>{nombre}</title>
            <Mitad>
              {piezas.map((d) => (
                <g key={d}>
                  <path
                    d={d}
                    className="musculo transition-[fill] duration-500"
                    style={{ animationDelay: retraso, transitionDelay: retraso }}
                    stroke={activo ? 'var(--color-neutral-50)' : 'var(--color-fondo)'}
                    strokeWidth={activo ? 2 : 1.5}
                    strokeLinejoin="round"
                  />
                  <path d={d} fill={`url(#${idBrillo})`} className="pointer-events-none" />
                </g>
              ))}
            </Mitad>
          </g>
        );
      })}
    </svg>
  );
}
