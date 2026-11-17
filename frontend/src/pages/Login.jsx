import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Campo from '../components/ui/Campo';
import Boton from '../components/ui/Boton';
import Icono from '../components/ui/Icono';

export default function Login() {
  const { usuario, login, sesionExpirada } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const actualizar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.desde ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="animate-pagina mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-[calc(1.25rem+env(safe-area-inset-top))]">
      <Link
        to="/bienvenida"
        aria-label="Volver"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
      >
        <Icono nombre="atras" className="h-5 w-5" />
      </Link>

      <div className="mb-8 mt-8 space-y-2">
        <h1 className="text-[34px] font-extrabold leading-tight tracking-tight">
          Bienvenido <span className="text-primario">de vuelta</span>
        </h1>
        <p className="text-neutral-400">Inicia sesión para seguir con tu progreso.</p>
      </div>

      <form onSubmit={enviar} className="space-y-4">
        {sesionExpirada && !error && (
          <div role="status" className="rounded-2xl border border-alerta/40 bg-alerta/10 px-4 py-3 text-sm text-amber-200">
            Tu sesión terminó. Inicia sesión de nuevo para seguir.
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <Campo etiqueta="Correo" id="email" name="email" type="email"
               value={form.email} onChange={actualizar}
               autoComplete="email" placeholder="tu@correo.com" required />
        <Campo etiqueta="Contraseña" id="password" name="password" type="password"
               value={form.password} onChange={actualizar}
               autoComplete="current-password" required />

        <Boton type="submit" cargando={enviando} className="mt-2 w-full">Iniciar sesión</Boton>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-400">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-bold text-primario hover:underline">Regístrate</Link>
      </p>
    </div>
  );
}
