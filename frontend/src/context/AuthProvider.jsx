import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { api, tokenStorage, EVENTO_SESION_EXPIRADA } from '../services/api';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // Solo hay que esperar al perfil si hay un token guardado
  const [cargando, setCargando] = useState(() => Boolean(tokenStorage.get()));
  const [sesionExpirada, setSesionExpirada] = useState(false);

  useEffect(() => {
    if (!tokenStorage.get()) return;
    api('/auth/perfil')
      .then(setUsuario)
      .catch(() => tokenStorage.clear())
      .finally(() => setCargando(false));
  }, []);

  // api.js avisa cuando el servidor rechaza el token (venció o es inválido)
  useEffect(() => {
    const expirar = () => {
      setUsuario(null);
      setSesionExpirada(true);
      if ('caches' in window) caches.delete('api').catch(() => {});
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, expirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, expirar);
  }, []);

  const iniciarConToken = useCallback(async (token) => {
    tokenStorage.set(token);
    const perfil = await api('/auth/perfil');
    setUsuario(perfil);
    setSesionExpirada(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token } = await api('/auth/login', { method: 'POST', body: { email, password } });
    await iniciarConToken(token);
  }, [iniciarConToken]);

  const registro = useCallback(async (datos) => {
    const { token } = await api('/auth/registro', { method: 'POST', body: datos });
    await iniciarConToken(token);
  }, [iniciarConToken]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUsuario(null);
    // Borra los datos guardados para usar sin conexión: si otra persona inicia
    // sesión en este teléfono, no debe ver los tuyos
    if ('caches' in window) caches.delete('api').catch(() => {});
  }, []);

  // El perfil devuelve al usuario ya actualizado (nombre, unidad, foto)
  const actualizarUsuario = useCallback((perfil) => setUsuario(perfil), []);

  const valor = useMemo(
    () => ({ usuario, cargando, sesionExpirada, login, registro, logout, actualizarUsuario }),
    [usuario, cargando, sesionExpirada, login, registro, logout, actualizarUsuario]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}