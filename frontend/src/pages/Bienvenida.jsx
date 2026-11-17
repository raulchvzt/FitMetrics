import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icono from '../components/ui/Icono';

export default function Bienvenida() {
  const { usuario } = useAuth();
  const location = useLocation();

  if (usuario) return <Navigate to="/" replace />;

  return (
    <div className="tema-oscuro animate-pagina relative mx-auto min-h-dvh max-w-md overflow-hidden">
      {/* Foto completa arriba, nítida; se funde con el fondo negro hacia abajo */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0">
        <img
          src="/bienvenida.webp"
          alt=""
          width="1005"
          height="1256"
          className="block h-auto max-h-[74dvh] w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.55)_0%,rgba(10,10,10,0)_18%,rgba(10,10,10,0)_55%,rgba(10,10,10,0.75)_82%,#0A0A0A_100%)]" />
      </div>

      <div className="absolute left-6 top-[calc(1.25rem+env(safe-area-inset-top))]">
        <span className="text-lg font-extrabold tracking-tight">FitMetrics</span>
      </div>

      <div className="relative flex min-h-dvh flex-col justify-end px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <h1 className="text-[42px] font-extrabold leading-[1.06] tracking-tight">
          Cada serie cuenta.
          <br />
          <span className="text-primario">Mídela.</span>
        </h1>
        <p className="mt-3.5 text-[15px] leading-relaxed text-neutral-400">
          Registra tus series, controla tu volumen semanal y progresa con datos, no con suposiciones.
        </p>

        <div className="mt-7 flex flex-col gap-2">
          <Link
            to="/registro"
            className="flex h-14 items-center justify-center gap-2 rounded-full bg-primario font-extrabold text-sobre-primario transition hover:bg-primario-claro"
          >
            Crear cuenta
            <Icono nombre="avanzar" className="h-5 w-5" />
          </Link>
          <Link
            to="/login"
            state={location.state}
            className="flex h-12 items-center justify-center rounded-full text-[15px] font-semibold text-neutral-50"
          >
            Ya tengo cuenta ·<span className="ml-1 text-primario">Iniciar sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
