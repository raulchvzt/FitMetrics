import { NavLink, Outlet } from 'react-router-dom';
import Icono from './ui/Icono';

const secciones = [
  { ruta: '/', etiqueta: 'Inicio', icono: 'inicio' },
  { ruta: '/rutinas', etiqueta: 'Rutinas', icono: 'rutinas' },
  { ruta: '/entrenar', etiqueta: 'Entrenar', icono: 'entrenar' },
  { ruta: '/progreso', etiqueta: 'Progreso', icono: 'progreso' },
  { ruta: '/suplementos', etiqueta: 'Suplem.', icono: 'suplementos' }
];

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <main className="flex-1 px-5 pb-28 pt-6">
        <Outlet />
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 border-t border-borde bg-nav pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-md justify-around px-1 pb-3 pt-2">
          {secciones.map((s) => (
            <NavLink
              key={s.ruta}
              to={s.ruta}
              end={s.ruta === '/'}
              className={({ isActive }) =>
                `flex min-w-16 flex-col items-center gap-1 py-1.5 text-[11px] transition
                 ${isActive ? 'font-semibold text-blue-400' : 'font-medium text-slate-400 hover:text-slate-200'}`
              }
            >
              <Icono nombre={s.icono} />
              {s.etiqueta}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}