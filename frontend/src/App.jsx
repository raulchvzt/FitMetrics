import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';
import Bienvenida from './pages/Bienvenida';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Inicio from './pages/Inicio';
import Rutinas from './pages/Rutinas';
import RutinaEditor from './pages/RutinaEditor';
import Entrenar from './pages/Entrenar';
import Historial from './pages/Historial';
import SesionDetalle from './pages/SesionDetalle';
import RangosVolumen from './pages/RangosVolumen';
import Suplementos from './pages/Suplementos';
import SuplementoEditor from './pages/SuplementoEditor';
import Perfil from './pages/Perfil';
import AvisosApp from './components/AvisosApp';

const Progreso = lazy(() => import('./pages/Progreso'));

export default function App() {
  return (
    <>
      <AvisosApp />
      <Routes>
        <Route path="/bienvenida" element={<Bienvenida />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        <Route element={<RutaProtegida />}>
          <Route path="/entrenar" element={<Entrenar />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/rutinas" element={<Rutinas />} />
            <Route path="/rutinas/nueva" element={<RutinaEditor />} />
            <Route path="/rutinas/:id" element={<RutinaEditor />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/historial/:id" element={<SesionDetalle />} />
            <Route path="/progreso/rangos" element={<RangosVolumen />} />
            <Route
              path="/progreso"
              element={
                <Suspense fallback={<p className="text-neutral-400">Cargando…</p>}>
                  <Progreso />
                </Suspense>
              }
            />
            <Route path="/suplementos" element={<Suplementos />} />
            <Route path="/suplementos/nuevo" element={<SuplementoEditor />} />
            <Route path="/suplementos/:id" element={<SuplementoEditor />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}