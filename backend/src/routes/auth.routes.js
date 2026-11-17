import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';


const router = Router();

router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, authController.actualizarPerfil);
router.put('/perfil/foto', verificarToken, authController.actualizarFoto);
router.delete('/perfil/foto', verificarToken, authController.quitarFoto);
router.put('/password', verificarToken, authController.cambiarPassword);

export default router;