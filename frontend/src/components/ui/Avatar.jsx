// Foto de perfil, o la inicial del nombre si no hay foto
export default function Avatar({ usuario, className = 'h-12 w-12 text-lg' }) {
  const inicial = usuario.nombre.trim().charAt(0).toUpperCase();

  if (usuario.foto) {
    return <img src={usuario.foto} alt="" className={`${className} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-elevado font-extrabold`}
    >
      {inicial}
    </span>
  );
}
