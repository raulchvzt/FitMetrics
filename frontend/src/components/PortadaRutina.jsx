import { useState } from 'react';
import { fotoDeRutina } from '../utils/fotosRutinas';

// Si la foto no carga (sin internet, foto borrada), queda un degradado con el estilo de la app
function Respaldo() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(212,255,63,0.28),transparent_55%),linear-gradient(135deg,#1F1F1F,#0A0A0A)]"
    />
  );
}

// Foto de fondo de una rutina con un oscurecido abajo para que el texto se lea.
// rutina = { id, foto } (id puede faltar en una rutina nueva)
// nombreTransicion: la misma foto en dos pantallas "vuela" de una a otra al navegar
export default function PortadaRutina({ rutina, ancho = 800, oscurecer = true, nombreTransicion, className = '', children }) {
  const fuente = rutina.id || rutina.foto ? fotoDeRutina(rutina, ancho) : null;
  // Guardamos qué foto falló: si cambia la foto, se vuelve a intentar sola
  const [fallida, setFallida] = useState(null);

  return (
    <div
      className={`tema-oscuro relative isolate overflow-hidden bg-elevado ${className}`}
      style={nombreTransicion ? { viewTransitionName: nombreTransicion } : undefined}
    >
      {fuente && fuente !== fallida ? (
        <img
          src={fuente}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFallida(fuente)}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 -z-10"><Respaldo /></div>
      )}
      {oscurecer && (
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/45 to-black/10" />
      )}
      {children}
    </div>
  );
}
