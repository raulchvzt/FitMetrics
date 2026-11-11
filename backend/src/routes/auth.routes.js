import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';


const router = Router();

router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, authController.actualizarPerfil);

export default router;