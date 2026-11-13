import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Proximamente from './pages/Proximamente';
import Boton from './components/ui/Boton';

function InicioTemporal() {
  const { usuario, logout } = useAuth();
  return (
    <div className="space-y-4">
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
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<InicioTemporal />} />
          <Route path="/rutinas" element={<Proximamente titulo="Rutinas" />} />
          <Route path="/entrenar" element={<Proximamente titulo="Entrenar" />} />
          <Route path="/progreso" element={<Proximamente titulo="Progreso" />} />
          <Route path="/suplementos" element={<Proximamente titulo="Suplementos" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}