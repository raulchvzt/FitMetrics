import { Link } from 'react-router-dom';
import { marcarDireccion } from '../../utils/transiciones';

// Link con transición animada entre pantallas (View Transitions).
// direccion: "adelante" (entrar), "atras" (volver) o "tab" (cambiar de sección)
export default function Enlace({ direccion = 'adelante', onClick, ...props }) {
  return (
    <Link
      viewTransition
      {...props}
      onClick={(evento) => {
        marcarDireccion(direccion);
        onClick?.(evento);
      }}
    />
  );
}
