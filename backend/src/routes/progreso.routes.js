import { Router } from 'express';
import * as progresoController from '../controllers/progreso.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/volumen', progresoController.volumen);
router.get('/ejercicios', progresoController.ejercicios);
router.get('/fuerza/:ejercicioId', progresoController.fuerza);

export default router;