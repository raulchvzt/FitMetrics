import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RutaProtegida() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <div className="flex min-h-dvh items-center justify-center text-neutral-400">Cargando…</div>;
  }

  if (!usuario) {
    return <Navigate to="/bienvenida" replace state={{ desde: location.pathname }} />;
  }

  return <Outlet />;
}