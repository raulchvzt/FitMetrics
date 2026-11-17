// Dibujos de suplementos en el estilo de la app: contorno gris, cuerpo del color
// de las tarjetas y un acento lima. Usan las variables del tema, así que se
// adaptan solos al modo claro.

// Contorno + relleno en una sola className (si van separadas, una pisa a la otra)
const trazo = (relleno = 'fill-none') => ({
  className: `stroke-neutral-400 ${relleno}`,
  strokeWidth: 2.2,
  strokeLinejoin: 'round',
  strokeLinecap: 'round'
});

function Polvo() {
  return (
    <>
      {/* Tapa */}
      <rect x="12" y="13" width="36" height="9" rx="3" {...trazo('fill-neutral-700')} />
      {/* Bote y etiqueta */}
      <rect x="14" y="22" width="32" height="32" rx="6" className="fill-superficie" />
      <rect x="14" y="31" width="32" height="13" className="fill-primario" />
      <rect x="14" y="22" width="32" height="32" rx="6" {...trazo()} />
      {/* Scoop */}
      <path d="M41 47 h14 a7 6 0 0 1 -14 0 z" {...trazo('fill-superficie')} />
      <path d="M55 47 l4 -6" {...trazo()} />
      <ellipse cx="48" cy="47" rx="6" ry="1.6" className="fill-primario" />
    </>
  );
}

function Capsula({ x, y, angulo, acento }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angulo})`}>
      <path d="M0 -6 h-9 a6 6 0 0 0 0 12 h9 z" className={acento ? 'fill-primario' : 'fill-neutral-700'} />
      <path d="M0 -6 h9 a6 6 0 0 1 0 12 h-9 z" className="fill-superficie" />
      <rect x="-15" y="-6" width="30" height="12" rx="6" {...trazo()} />
      <path d="M0 -6 v12" {...trazo()} />
    </g>
  );
}

function Capsulas() {
  return (
    <>
      <Capsula x={25} y={26} angulo={-35} acento />
      <Capsula x={39} y={42} angulo={20} acento={false} />
    </>
  );
}

function Tableta({ x, y, acento }) {
  return (
    <g>
      <circle cx={x} cy={y} r="10" {...trazo(acento ? 'fill-primario' : 'fill-superficie')} />
      <path d={`M${x - 6} ${y} h12`} {...trazo()} />
    </g>
  );
}

function Tabletas() {
  return (
    <>
      <Tableta x={24} y={40} acento={false} />
      <Tableta x={43} y={42} acento={false} />
      <Tableta x={33} y={23} acento />
    </>
  );
}

function Liquido() {
  return (
    <>
      {/* Gotero */}
      <rect x="27" y="8" width="10" height="13" rx="5" {...trazo('fill-neutral-700')} />
      <rect x="25" y="20" width="14" height="8" rx="2" {...trazo('fill-superficie')} />
      {/* Frasco con líquido */}
      <rect x="18" y="28" width="28" height="28" rx="7" className="fill-superficie" />
      <path d="M18 42 h28 v7 a7 7 0 0 1 -7 7 h-14 a7 7 0 0 1 -7 -7 z" className="fill-primario" />
      <rect x="18" y="28" width="28" height="28" rx="7" {...trazo()} />
    </>
  );
}

function Sobre() {
  const dientes = 'M15 16 l3.5 -4 l3.5 4 l3.5 -4 l3.5 4 l3.5 -4 l3.5 4 l3.5 -4 l3.5 4 l3.5 -4 l3.5 4';
  return (
    <>
      <path d={`${dientes} V52 a4 4 0 0 1 -4 4 H19 a4 4 0 0 1 -4 -4 z`} className="fill-superficie" />
      <rect x="15" y="28" width="34" height="12" className="fill-primario" />
      <path d={`${dientes} V52 a4 4 0 0 1 -4 4 H19 a4 4 0 0 1 -4 -4 z`} {...trazo()} />
      <path d="M22 48 h12" {...trazo()} />
    </>
  );
}

const DIBUJOS = { polvo: Polvo, capsulas: Capsulas, tabletas: Tabletas, liquido: Liquido, sobre: Sobre };

export default function IlustracionSuplemento({ tipo, className = 'h-14 w-14' }) {
  const Dibujo = DIBUJOS[tipo] ?? Polvo;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <Dibujo />
    </svg>
  );
}
