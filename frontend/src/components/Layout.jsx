import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Icono from './ui/Icono';
import { conTransiciones, marcarDireccion } from '../utils/transiciones';

const secciones = [
  { ruta: '/', etiqueta: 'Inicio', icono: 'inicio' },
  { ruta: '/rutinas', etiqueta: 'Rutinas', icono: 'rutinas' },
  { ruta: '/entrenar', etiqueta: 'Entrenar', icono: 'entrenar' },
  { ruta: '/progreso', etiqueta: 'Progreso', icono: 'progreso' },
  { ruta: '/suplementos', etiqueta: 'Suplementos', icono: 'suplementos' }
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <main className="flex-1 px-5 pb-32 pt-[calc(1.5rem+env(safe-area-inset-top))]">
        {/* Con View Transitions el navegador anima el cambio de pantalla; si no las
            soporta, la key nueva en cada pantalla reinicia la animación de entrada */}
        <div key={pathname} className={conTransiciones ? undefined : 'animate-pagina'}>
          <Outlet />
        </div>
      </main>

      <nav
        aria-label="Navegación principal"
        className="barra-navegacion fixed inset-x-0 bottom-0 z-20 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto flex h-17 max-w-md items-center justify-between rounded-full border border-borde bg-superficie px-2.5 shadow-lg shadow-sombra/50">
          {secciones.map((s) => (
            <NavLink
              key={s.ruta}
              to={s.ruta}
              end={s.ruta === '/'}
              viewTransition
              onClick={() => marcarDireccion('tab')}
              className={({ isActive }) =>
                isActive
                  ? 'flex h-12 items-center gap-2 rounded-full bg-elevado pl-1.5 pr-4 text-sm font-bold text-neutral-50'
                  : 'flex h-12 w-12 items-center justify-center rounded-full text-neutral-400 transition hover:text-neutral-100'
              }
            >
              {({ isActive }) =>
                isActive ? (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primario text-sobre-primario">
                      <Icono nombre={s.icono} className="h-5 w-5" />
                    </span>
                    {s.etiqueta === 'Suplementos' ? 'Suplem.' : s.etiqueta}
                  </>
                ) : (
                  <>
                    <Icono nombre={s.icono} className="h-6 w-6" />
                    <span className="sr-only">{s.etiqueta}</span>
                  </>
                )
              }
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
