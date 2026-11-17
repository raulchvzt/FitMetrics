import { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { reducirImagen } from '../utils/imagen';
import Avatar from '../components/ui/Avatar';
import Boton from '../components/ui/Boton';
import Campo from '../components/ui/Campo';
import Icono from '../components/ui/Icono';
import { useTema } from '../hooks/useTema';
import Enlace from '../components/ui/Enlace';

const KG_POR_LB = 0.45359237;

const miembroDesde = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });

function convertirPeso(texto, de, a) {
  const valor = Number(texto);
  if (texto === '' || !Number.isFinite(valor) || de === a) return texto;
  const convertido = a === 'lb' ? valor / KG_POR_LB : valor * KG_POR_LB;
  return String(Math.round(convertido * 10) / 10);
}

function datosIniciales(usuario) {
  return {
    nombre: usuario.nombre,
    unidadPeso: usuario.unidadPeso,
    peso: usuario.pesoCorporal === null ? '' : String(usuario.pesoCorporal)
  };
}

function Aviso({ tipo, children }) {
  const estilos = tipo === 'error'
    ? 'border-peligro/40 bg-peligro/10 text-red-300'
    : 'border-primario/30 bg-primario/10 text-primario';
  return (
    <p role={tipo === 'error' ? 'alert' : 'status'} className={`rounded-2xl border px-4 py-3 text-sm ${estilos}`}>
      {children}
    </p>
  );
}

// ---------- Foto ----------

function SeccionFoto({ usuario, onActualizado }) {
  const entrada = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  async function elegir(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = ''; // permite volver a elegir la misma foto
    if (!archivo) return;

    setError('');
    setSubiendo(true);
    try {
      const foto = await reducirImagen(archivo, { ancho: 400, alto: 400 });
      onActualizado(await api('/auth/perfil/foto', { method: 'PUT', body: { foto } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function quitar() {
    setError('');
    setSubiendo(true);
    try {
      onActualizado(await api('/auth/perfil/foto', { method: 'DELETE' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <section className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        <div className={`rounded-full border-2 border-primario p-1 transition-opacity ${subiendo ? 'opacity-50' : ''}`}>
          <Avatar usuario={usuario} className="h-28 w-28 text-4xl" />
        </div>
        <button
          type="button"
          onClick={() => entrada.current.click()}
          disabled={subiendo}
          aria-label="Cambiar foto de perfil"
          className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-fondo
                     bg-primario text-sobre-primario transition hover:bg-primario-claro"
        >
          <Icono nombre="camara" className="h-5 w-5" />
        </button>
        <input ref={entrada} type="file" accept="image/*" onChange={elegir} className="hidden" />
      </div>

      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{usuario.nombre}</h2>
        <p className="text-sm text-neutral-400">{usuario.email}</p>
        <p className="mt-1 text-xs text-neutral-500">
          Miembro desde {miembroDesde.format(new Date(usuario.fechaRegistro))}
        </p>
      </div>

      {subiendo && <p className="text-sm text-neutral-400">Guardando foto…</p>}
      {!subiendo && usuario.foto && (
        <button type="button" onClick={quitar} className="text-sm font-bold text-neutral-400 hover:text-neutral-100">
          Quitar foto
        </button>
      )}
      {error && <Aviso tipo="error">{error}</Aviso>}
    </section>
  );
}

// ---------- Datos personales ----------

function SeccionDatos({ usuario, onActualizado }) {
  const [form, setForm] = useState(() => datosIniciales(usuario));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const original = datosIniciales(usuario);
  const pesoCambio = form.peso !== convertirPeso(original.peso, original.unidadPeso, form.unidadPeso);
  const hayCambios = form.nombre.trim() !== original.nombre
    || form.unidadPeso !== original.unidadPeso
    || pesoCambio;

  function cambiarUnidad(unidad) {
    // El peso escrito se convierte para que siga siendo el mismo peso real
    setForm((f) => ({ ...f, unidadPeso: unidad, peso: convertirPeso(f.peso, f.unidadPeso, unidad) }));
    setMensaje(null);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setMensaje(null);

    const nombre = form.nombre.trim();
    if (!nombre) {
      setMensaje({ tipo: 'error', texto: 'Escribe tu nombre' });
      return;
    }
    const peso = form.peso === '' ? null : Number(form.peso);
    if (peso !== null && !Number.isFinite(peso)) {
      setMensaje({ tipo: 'error', texto: 'El peso corporal no es válido' });
      return;
    }

    setGuardando(true);
    try {
      const perfil = await api('/auth/perfil', {
        method: 'PUT',
        // Si solo cambió la unidad, el peso guardado (en kg) se queda igual
        body: { nombre, unidadPeso: form.unidadPeso, ...(pesoCambio && { pesoCorporal: peso }) }
      });
      onActualizado(perfil);
      setForm(datosIniciales(perfil));
      setMensaje({ tipo: 'exito', texto: 'Cambios guardados' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4 rounded-[28px] bg-superficie p-5">
      <h3 className="font-extrabold">Datos personales</h3>

      <Campo
        etiqueta="Nombre"
        id="perfil-nombre"
        value={form.nombre}
        maxLength={100}
        autoComplete="name"
        onChange={(e) => {
          setForm((f) => ({ ...f, nombre: e.target.value }));
          setMensaje(null);
        }}
      />

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-neutral-300">Unidad de peso</legend>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-fondo p-1">
          {['kg', 'lb'].map((unidad) => (
            <button
              key={unidad}
              type="button"
              aria-pressed={form.unidadPeso === unidad}
              onClick={() => cambiarUnidad(unidad)}
              className={`h-11 rounded-full font-mono font-bold transition
                ${form.unidadPeso === unidad ? 'bg-primario text-sobre-primario' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              {unidad}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-neutral-400">
          Todos tus pesos se mostrarán en esta unidad. Tus registros no cambian.
        </p>
      </fieldset>

      <div className="relative">
        <Campo
          etiqueta="Peso corporal (opcional)"
          id="perfil-peso"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0"
          value={form.peso}
          placeholder="Sin registrar"
          onChange={(e) => {
            setForm((f) => ({ ...f, peso: e.target.value }));
            setMensaje(null);
          }}
        />
        <span className="pointer-events-none absolute bottom-0 right-4 flex h-13 items-center font-mono text-sm text-neutral-400">
          {form.unidadPeso}
        </span>
      </div>

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      <Boton type="submit" cargando={guardando} disabled={!hayCambios} className="w-full">
        Guardar cambios
      </Boton>
    </form>
  );
}

// ---------- Apariencia ----------

const TEMAS = [
  { id: 'oscuro', etiqueta: 'Oscuro', icono: 'luna' },
  { id: 'claro', etiqueta: 'Claro', icono: 'sol' }
];

function SeccionApariencia() {
  const { tema, cambiarTema } = useTema();

  return (
    <section className="space-y-3 rounded-[28px] bg-superficie p-5">
      <div>
        <h3 className="font-extrabold">Apariencia</h3>
        <p className="text-xs text-neutral-400">También puedes cambiarlo con el botón del inicio</p>
      </div>
      <div role="group" aria-label="Tema" className="grid grid-cols-2 gap-1 rounded-full bg-fondo p-1">
        {TEMAS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tema === t.id}
            onClick={() => cambiarTema(t.id)}
            className={`flex h-11 items-center justify-center gap-2 rounded-full font-bold transition
              ${tema === t.id ? 'bg-primario text-sobre-primario' : 'text-neutral-400 hover:text-neutral-100'}`}
          >
            <Icono nombre={t.icono} className="h-4 w-4" />
            {t.etiqueta}
          </button>
        ))}
      </div>
    </section>
  );
}

// ---------- Contraseña ----------

const SIN_CONTRASENAS = { actual: '', nueva: '', confirmar: '' };

function SeccionContrasena() {
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState(SIN_CONTRASENAS);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  function actualizar(evento) {
    setForm((f) => ({ ...f, [evento.target.name]: evento.target.value }));
    setMensaje(null);
  }

  async function guardar(evento) {
    evento.preventDefault();
    if (form.nueva.length < 8) {
      setMensaje({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }
    if (form.nueva !== form.confirmar) {
      setMensaje({ tipo: 'error', texto: 'La confirmación no coincide con la nueva contraseña' });
      return;
    }

    setGuardando(true);
    try {
      await api('/auth/password', { method: 'PUT', body: { actual: form.actual, nueva: form.nueva } });
      setForm(SIN_CONTRASENAS);
      setAbierta(false);
      setMensaje({ tipo: 'exito', texto: 'Contraseña actualizada' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    } finally {
      setGuardando(false);
    }
  }

  if (!abierta) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setAbierta(true);
            setMensaje(null);
          }}
          className="flex w-full items-center gap-3 rounded-3xl bg-superficie p-3 pr-4 text-left transition hover:bg-elevado"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-elevado text-primario">
            <Icono nombre="candado" />
          </span>
          <span className="flex-1 font-bold">Cambiar contraseña</span>
          <Icono nombre="flecha" className="h-5 w-5 text-neutral-500" />
        </button>
        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      </div>
    );
  }

  return (
    <form onSubmit={guardar} className="space-y-4 rounded-[28px] bg-superficie p-5">
      <h3 className="font-extrabold">Cambiar contraseña</h3>
      <Campo etiqueta="Contraseña actual" id="pass-actual" name="actual" type="password"
             value={form.actual} onChange={actualizar} autoComplete="current-password" required />
      <Campo etiqueta="Nueva contraseña" id="pass-nueva" name="nueva" type="password"
             value={form.nueva} onChange={actualizar} autoComplete="new-password"
             placeholder="Mínimo 8 caracteres" required />
      <Campo etiqueta="Confirmar nueva contraseña" id="pass-confirmar" name="confirmar" type="password"
             value={form.confirmar} onChange={actualizar} autoComplete="new-password" required />

      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}

      <div className="grid grid-cols-2 gap-2">
        <Boton
          type="button"
          variante="secundario"
          onClick={() => {
            setAbierta(false);
            setForm(SIN_CONTRASENAS);
            setMensaje(null);
          }}
        >
          Cancelar
        </Boton>
        <Boton type="submit" cargando={guardando}>Guardar</Boton>
      </div>
    </form>
  );
}

// ---------- Pantalla ----------

export default function Perfil() {
  const { usuario, logout, actualizarUsuario } = useAuth();

  return (
    <div className="escalonado space-y-5">
      <header className="flex items-center gap-3">
        <Enlace
          direccion="atras"
          to="/"
          aria-label="Volver al inicio"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-superficie text-neutral-50 transition hover:bg-elevado"
        >
          <Icono nombre="atras" className="h-5 w-5" />
        </Enlace>
        <h1 className="text-2xl font-extrabold tracking-tight">Mi perfil</h1>
      </header>

      <SeccionFoto usuario={usuario} onActualizado={actualizarUsuario} />
      <SeccionDatos usuario={usuario} onActualizado={actualizarUsuario} />
      <SeccionApariencia />
      <SeccionContrasena />

      <button
        type="button"
        onClick={logout}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-full border border-peligro/40 font-bold text-red-300
                   transition hover:bg-peligro/10"
      >
        <Icono nombre="salir" className="h-5 w-5" />
        Cerrar sesión
      </button>
    </div>
  );
}
