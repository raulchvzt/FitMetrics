import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { api, tokenStorage } from '../services/api';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!tokenStorage.get()) {
      setCargando(false);
      return;
    }
    api('/auth/perfil')
      .then(setUsuario)
      .catch(() => tokenStorage.clear())
      .finally(() => setCargando(false));
  }, []);

  const iniciarConToken = useCallback(async (token) => {
    tokenStorage.set(token);
    const perfil = await api('/auth/perfil');
    setUsuario(perfil);
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
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, login, registro, logout }),
    [usuario, cargando, login, registro, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}