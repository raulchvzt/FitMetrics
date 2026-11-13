import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Inicio from './pages/Inicio';
import Proximamente from './pages/Proximamente';
import Rutinas from './pages/Rutinas';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/rutinas" element={<Rutinas />} />
          <Route path="/rutinas/nueva" element={<Proximamente titulo="Nueva rutina" />} />
          <Route path="/rutinas/:id" element={<Proximamente titulo="Editar rutina" />} />         
           <Route path="/entrenar" element={<Proximamente titulo="Entrenar" />} />
          <Route path="/progreso" element={<Proximamente titulo="Progreso" />} />
          <Route path="/suplementos" element={<Proximamente titulo="Suplementos" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}