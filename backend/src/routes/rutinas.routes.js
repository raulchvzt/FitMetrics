import { Router } from 'express';
import * as rutinasController from '../controllers/rutinas.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', rutinasController.listar);
router.get('/:id', rutinasController.obtener);
router.post('/', rutinasController.crear);
router.put('/:id', rutinasController.actualizar);
router.delete('/:id', rutinasController.eliminar);

export default router;