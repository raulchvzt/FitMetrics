import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import healthRoutes from './routes/health.routes.js';
import ejerciciosRoutes from './routes/ejercicios.routes.js';
import authRoutes from './routes/auth.routes.js';
import rutinasRoutes from './routes/rutinas.routes.js';
import sesionesRoutes from './routes/sesiones.routes.js';
import progresoRoutes from './routes/progreso.routes.js';
import suplementosRoutes from './routes/suplementos.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import { confiarEnProxy, origenesPermitidos } from './config/seguridad.js';
import { limiteGeneral } from './middlewares/limites.js';

// Errores de express.json() (vienen en inglés)
const ERRORES_CUERPO = {
  'entity.too.large': 'El archivo es demasiado grande',
  'entity.parse.failed': 'Los datos enviados no son un JSON válido'
};

// Arma la aplicación sin encender el servidor: así las pruebas pueden usarla
export function crearApp(env = process.env) {
  const app = express();
  const permitidos = origenesPermitidos(env);

  app.set('trust proxy', confiarEnProxy(env));

  // Encabezados de seguridad (y oculta que el servidor usa Express)
  app.use(helmet());

  app.use(cors({
    origin(origen, responder) {
      // Sin origen = la misma página, Postman o la app instalada: se permite
      if (!origen || permitidos.has(origen)) return responder(null, true);
      responder(null, false); // el navegador bloquea la respuesta
    }
  }));

  app.use('/api', limiteGeneral);

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

  app.use((err, req, res, next) => {
    const status = err.status || 500;

    if (status === 500) {
      console.error('❌', err);
    }

    res.status(status).json({
      error: status === 500 ? 'Error interno del servidor' : ERRORES_CUERPO[err.type] ?? err.message
    });
  });

  return app;
}
