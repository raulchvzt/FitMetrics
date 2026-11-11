import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.routes.js';
import ejerciciosRoutes from './routes/ejercicios.routes.js';
import authRoutes from './routes/auth.routes.js';

if (!process.env.JWT_SECRET) {
  console.error('❌ Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);
app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (status === 500) {
    console.error('❌', err);
  }

  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 FitMetrics API en http://localhost:${PORT}`);
});