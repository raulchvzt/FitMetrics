import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.routes.js';
import ejerciciosRoutes from './routes/ejercicios.routes.js';
import authRoutes from './routes/auth.routes.js';
import rutinasRoutes from './routes/rutinas.routes.js';
import sesionesRoutes from './routes/sesiones.routes.js';
import progresoRoutes from './routes/progreso.routes.js';
import suplementosRoutes from './routes/suplementos.routes.js';
import reportesRoutes from './routes/reportes.routes.js';


if (!process.env.JWT_SECRET) {
  console.error('❌ Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

const app = express();

app.use(cors());
// Las fotos llegan en base64 dentro del JSON: se sube el límite (por defecto es 100 KB)
app.use(express.json({ limit: '512kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/rutinas', rutinasRoutes);
app.use('/api/sesiones', sesionesRoutes);
app.use('/api/progreso', progresoRoutes);
app.use('/api/suplementos', suplementosRoutes);
app.use('/api/reportes', reportesRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Errores de express.json() (vienen en inglés)
const ERRORES_CUERPO = {
  'entity.too.large': 'El archivo es demasiado grande',
  'entity.parse.failed': 'Los datos enviados no son un JSON válido'
};

app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (status === 500) {
    console.error('❌', err);
  }

  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : ERRORES_CUERPO[err.type] ?? err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FitMetrics API en http://localhost:${PORT}`);
});