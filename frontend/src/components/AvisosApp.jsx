import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Icono from './ui/Icono';
import { EVENTO_DESPERTANDO } from '../services/api';

const UNA_HORA = 60 * 60 * 1000;

function useEnLinea() {
  const [enLinea, setEnLinea] = useState(() => navigator.onLine);
  useEffect(() => {
    const conectar = () => setEnLinea(true);
    const desconectar = () => setEnLinea(false);
    window.addEventListener('online', conectar);
    window.addEventListener('offline', desconectar);
    return () => {
      window.removeEventListener('online', conectar);
      window.removeEventListener('offline', desconectar);
    };
  }, []);
  return enLinea;
}

function useDespertando() {
  const [despertando, setDespertando] = useState(false);
  useEffect(() => {
    const cambiar = (evento) => setDespertando(evento.detail);
    window.addEventListener(EVENTO_DESPERTANDO, cambiar);
    return () => window.removeEventListener(EVENTO_DESPERTANDO, cambiar);
  }, []);
  return despertando;
}

// Avisos de la app instalada: "sin conexión", "despertando el servidor" y "hay una versión nueva"
export default function AvisosApp() {
  const enLinea = useEnLinea();
  const despertando = useDespertando();
  const {
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    updateServiceWorker
  } = useRegisterSW({
    // Una app instalada puede quedarse abierta días: revisa cada hora si hay versión nueva
    onRegisteredSW(_url, registro) {
      if (registro) setInterval(() => registro.update(), UNA_HORA);
    }
  });

  return (
    <>
      {!enLinea && (
        <div
          role="status"
          className="tema-oscuro pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-fit
                     max-w-[calc(100%-2rem)] animate-pagina items-center gap-2 rounded-full bg-elevado px-4 py-2 text-sm font-semibold
                     shadow-lg shadow-black/40"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-alerta" aria-hidden="true" />
          Sin conexión · viendo tus datos guardados
        </div>
      )}

      {enLinea && despertando && (
        <div
          role="status"
          className="tema-oscuro pointer-events-none fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-fit
                     max-w-[calc(100%-2rem)] animate-pagina items-center gap-2 rounded-full bg-elevado px-4 py-2 text-sm font-semibold
                     shadow-lg shadow-black/40"
        >
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-primario" aria-hidden="true" />
          Despertando el servidor · puede tardar hasta un minuto
        </div>
      )}

      {hayVersionNueva && (
        <div
          role="alert"
          className="tema-oscuro fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md
                     animate-hoja space-y-3 rounded-3xl bg-elevado p-4 shadow-xl shadow-black/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primario/15 text-primario">
              <Icono nombre="arriba" className="h-5 w-5" />
            </span>
            <p className="min-w-0 flex-1 text-sm">
              <span className="block font-bold">Hay una versión nueva</span>
              <span className="text-neutral-400">Actualiza cuando no estés entrenando.</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setHayVersionNueva(false)}
              className="h-11 rounded-full bg-superficie text-sm font-bold text-neutral-300"
            >
              Luego
            </button>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="h-11 rounded-full bg-primario text-sm font-extrabold text-sobre-primario"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
