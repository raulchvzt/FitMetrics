import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Campo from '../components/ui/Campo';
import Boton from '../components/ui/Boton';
import Icono from '../components/ui/Icono';

export default function Registro() {
  const { usuario, registro } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nombre: '', email: '', password: '', unidadPeso: 'kg' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const actualizar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setEnviando(true);
    try {
      await registro(form);
      navigate('/', { replace: true });
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
          <p className="text-sm text-slate-400">Crea tu cuenta</p>
        </div>

        <form onSubmit={enviar} className="space-y-4 rounded-2xl border border-borde bg-superficie p-6">
          {error && (
            <div role="alert" className="rounded-xl border border-peligro/40 bg-peligro/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <Campo etiqueta="Nombre" id="nombre" name="nombre"
                 value={form.nombre} onChange={actualizar} autoComplete="name" required />
          <Campo etiqueta="Correo" id="email" name="email" type="email"
                 value={form.email} onChange={actualizar} autoComplete="email"
                 placeholder="tu@correo.com" required />
          <Campo etiqueta="Contraseña" id="password" name="password" type="password"
                 value={form.password} onChange={actualizar} autoComplete="new-password"
                 placeholder="Mínimo 8 caracteres" required />

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-300">Unidad de peso</legend>
            <div className="grid grid-cols-2 gap-2">
              {['kg', 'lb'].map((unidad) => (
                <label
                  key={unidad}
                  className={`flex h-12 cursor-pointer items-center justify-center rounded-xl border font-mono font-semibold transition
                    has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primario/50
                    ${form.unidadPeso === unidad
                      ? 'border-primario bg-primario/15 text-white'
                      : 'border-borde text-slate-400 hover:text-slate-200'}`}
                >
                  <input type="radio" name="unidadPeso" value={unidad} className="sr-only"
                         checked={form.unidadPeso === unidad} onChange={actualizar} />
                  {unidad}
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Puedes cambiarla después en tu perfil.</p>
          </fieldset>

          <Boton type="submit" cargando={enviando} className="w-full">Crear cuenta</Boton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-blue-400 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}