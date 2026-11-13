import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Campo from '../components/ui/Campo';
import Boton from '../components/ui/Boton';
import Icono from '../components/ui/Icono';

export default function Login() {
  const { usuario, login } = useAuth();
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
    <div className="flex min-h-screen items-center justify-center px-6 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primario text-white">
            <Icono nombre="entrenar" className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Fit<span className="text-blue-400">Metrics</span>
          </h1>
          <p className="text-sm text-slate-400">Entrena con precisión</p>
        </div>

        <form onSubmit={enviar} className="space-y-4 rounded-2xl border border-borde bg-superficie p-6">
          {error && (
            <div role="alert" className="rounded-xl border border-peligro/40 bg-peligro/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <Campo etiqueta="Correo" id="email" name="email" type="email"
                 value={form.email} onChange={actualizar}
                 autoComplete="email" placeholder="tu@correo.com" required />
          <Campo etiqueta="Contraseña" id="password" name="password" type="password"
                 value={form.password} onChange={actualizar}
                 autoComplete="current-password" required />

          <Boton type="submit" cargando={enviando} className="w-full">Iniciar sesión</Boton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-blue-400 hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}