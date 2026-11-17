import IlustracionSuplemento from './IlustracionSuplemento';

// Foto del bote si el usuario subió una; si no, la ilustración de su tipo
export default function ImagenSuplemento({ suplemento, className = 'h-14 w-14 rounded-2xl' }) {
  if (suplemento.foto) {
    return <img src={suplemento.foto} alt="" className={`shrink-0 bg-elevado object-cover ${className}`} />;
  }
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center bg-elevado ${className}`}>
      <IlustracionSuplemento tipo={suplemento.ilustracion} className="h-[78%] w-[78%]" />
    </span>
  );
}
