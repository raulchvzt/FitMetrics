import { Router } from 'express';
import * as ejerciciosController from '../controllers/ejercicios.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Ahora pide sesión: cada usuario ve el catálogo más sus propios ejercicios
router.use(verificarToken);

router.get('/', ejerciciosController.listar);
router.get('/grupos', ejerciciosController.grupos);
router.post('/', ejerciciosController.crear);
router.put('/:id', ejerciciosController.actualizar);
router.delete('/:id', ejerciciosController.eliminar);
router.put('/:id/foto', ejerciciosController.actualizarFoto);
router.delete('/:id/foto', ejerciciosController.quitarFoto);

export default router;
