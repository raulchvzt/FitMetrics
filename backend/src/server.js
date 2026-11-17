import 'dotenv/config';
import { crearApp } from './app.js';
import { revisarSecretoJwt } from './config/seguridad.js';

const problema = revisarSecretoJwt(process.env.JWT_SECRET);
if (problema) {
  console.error(`❌ ${problema}`);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
crearApp().listen(PORT, () => {
  console.log(`🚀 FitMetrics API en http://localhost:${PORT}`);
});
