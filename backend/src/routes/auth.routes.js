import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { limiteLogin, limitePassword, limiteRegistro } from '../middlewares/limites.js';

const router = Router();

router.post('/registro', limiteRegistro, authController.registro);
router.post('/login', limiteLogin, authController.login);
router.get('/perfil', verificarToken, authController.perfil);
router.put('/perfil', verificarToken, authController.actualizarPerfil);
router.put('/perfil/foto', verificarToken, authController.actualizarFoto);
router.delete('/perfil/foto', verificarToken, authController.quitarFoto);
router.put('/password', verificarToken, limitePassword, authController.cambiarPassword);

export default router;