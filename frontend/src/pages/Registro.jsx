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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-8 pt-[calc(1.25rem+env(safe-area-inset-top))]">
      <Link
        to="/bienvenida"
        aria-label="Volver"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
      >
        <Icono nombre="atras" className="h-5 w-5" />
      </Link>

      <div className="mb-8 mt-8 space-y-2">
        <h1 className="text-[34px] font-extrabold leading-tight tracking-tight">
          Crea tu <span className="text-primario">cuenta</span>
        </h1>
        <p className="text-neutral-400">Empieza a medir cada serie desde hoy.</p>
      </div>

      <form onSubmit={enviar} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-red-300">
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
          <legend className="mb-1.5 text-sm font-semibold text-neutral-300">Unidad de peso</legend>
          <div className="grid grid-cols-2 gap-1 rounded-full bg-superficie p-1">
            {['kg', 'lb'].map((unidad) => (
              <label
                key={unidad}
                className={`flex h-11 cursor-pointer items-center justify-center rounded-full font-mono font-bold transition
                  has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primario/60
                  ${form.unidadPeso === unidad
                    ? 'bg-primario text-fondo'
                    : 'text-neutral-400 hover:text-neutral-100'}`}
              >
                <input type="radio" name="unidadPeso" value={unidad} className="sr-only"
                       checked={form.unidadPeso === unidad} onChange={actualizar} />
                {unidad}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-neutral-400">Puedes cambiarla después en tu perfil.</p>
        </fieldset>

        <Boton type="submit" cargando={enviando} className="mt-2 w-full">Crear cuenta</Boton>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-bold text-primario hover:underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
