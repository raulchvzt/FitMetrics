import { Router } from 'express';
import * as reportesController from '../controllers/reportes.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/resumen', reportesController.resumen);
router.get('/csv', reportesController.csv);
router.get('/pdf', reportesController.pdf);

export default router;