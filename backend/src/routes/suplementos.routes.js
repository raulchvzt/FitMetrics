import { Router } from 'express';
import * as suplementosController from '../controllers/suplementos.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', suplementosController.listar);
router.post('/', suplementosController.crear);
router.get('/:id', suplementosController.obtener);
router.put('/:id', suplementosController.actualizar);
router.delete('/:id', suplementosController.eliminar);

router.post('/:id/tomas', suplementosController.tomar);
router.delete('/:id/tomas/hoy', suplementosController.deshacerToma);
router.post('/:id/compras', suplementosController.comprar);
router.put('/:id/stock', suplementosController.ajustar);
router.get('/:id/movimientos', suplementosController.movimientos);

export default router;