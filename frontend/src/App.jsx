import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import RutaProtegida from './components/RutaProtegida';
import Login from './pages/Login';
import Boton from './components/ui/Boton';

function InicioTemporal() {
  const { usuario, logout } = useAuth();
  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Hola, {usuario.nombre}</h1>
      <p className="text-slate-400">Ya iniciaste sesión. Unidad: {usuario.unidadPeso}</p>
      <Boton variante="secundario" onClick={logout}>Cerrar sesión</Boton>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route path="/" element={<InicioTemporal />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}