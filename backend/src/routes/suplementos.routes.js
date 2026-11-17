import { Router } from 'express';
import * as suplementosController from '../controllers/suplementos.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', suplementosController.listar);
// Va antes de '/:id' para que "catalogo" no se lea como un id
router.get('/catalogo', suplementosController.catalogo);
router.post('/', suplementosController.crear);
router.get('/:id', suplementosController.obtener);
router.put('/:id', suplementosController.actualizar);
router.delete('/:id', suplementosController.eliminar);

router.post('/:id/tomas', suplementosController.tomar);
router.delete('/:id/tomas/hoy', suplementosController.deshacerToma);
router.post('/:id/compras', suplementosController.comprar);
router.put('/:id/stock', suplementosController.ajustar);
router.get('/:id/movimientos', suplementosController.movimientos);
router.put('/:id/foto', suplementosController.actualizarFoto);
router.delete('/:id/foto', suplementosController.quitarFoto);

export default router;