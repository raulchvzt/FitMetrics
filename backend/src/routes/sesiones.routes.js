import { Router } from 'express';
import * as sesionesController from '../controllers/sesiones.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', sesionesController.historial);
router.get('/activa', sesionesController.activa);   // debe ir ANTES de '/:id'
router.get('/:id', sesionesController.detalle);
router.post('/', sesionesController.iniciar);
router.delete('/:id', sesionesController.cancelar);
router.post('/:id/series', sesionesController.agregarSerie);
router.delete('/:id/series/:serieId', sesionesController.quitarSerie);
router.post('/:id/finalizar', sesionesController.finalizar);

export default router;