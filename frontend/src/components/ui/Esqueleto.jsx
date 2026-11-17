// Bloques grises con un brillo que pasa encima mientras cargan los datos.
// Tienen la forma aproximada de lo que va a aparecer, así la pantalla no "brinca".

export default function Esqueleto({ className = 'h-20 rounded-3xl' }) {
  return <div aria-hidden="true" className={`esqueleto ${className}`} />;
}

export function EsqueletoLista({ filas = 4, alto = 'h-20', redondeo = 'rounded-3xl', etiqueta = 'Cargando' }) {
  return (
    <div role="status" aria-label={etiqueta} className="space-y-2">
      {Array.from({ length: filas }, (_, i) => (
        <Esqueleto key={i} className={`${alto} ${redondeo}`} />
      ))}
    </div>
  );
}

// Para las pantallas de progreso: cuadros de números y una gráfica
export function EsqueletoGrafica() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Esqueleto className="h-24 rounded-3xl" />
        <Esqueleto className="h-24 rounded-3xl" />
      </div>
      <Esqueleto className="h-64 rounded-[28px]" />
      <Esqueleto className="h-16 rounded-3xl" />
    </div>
  );
}
