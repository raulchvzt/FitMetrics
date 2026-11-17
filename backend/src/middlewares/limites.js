import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

// Límites de peticiones: frenan a quien intenta adivinar contraseñas
// probando miles de combinaciones, o a quien satura el servidor.

function limitador({ ventanaMin, maximo, mensaje, clave }) {
  return rateLimit({
    windowMs: ventanaMin * 60 * 1000,
    limit: maximo,
    standardHeaders: 'draft-8', // el cliente ve cuántos intentos le quedan
    legacyHeaders: false,
    ...(clave && { keyGenerator: clave }),
    handler: (req, res, next, opciones) => {
      const minutos = Math.ceil(opciones.windowMs / 60000);
      res.status(429).json({ error: `${mensaje} Intenta de nuevo en ${minutos} minutos.` });
    }
  });
}

// Por IP y por correo: así no bloqueas a todos los de tu red WiFi,
// y tampoco se puede atacar una cuenta cambiando de IP sin límite.
const ipYCorreo = (req) => {
  const correo = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return `${ipKeyGenerator(req.ip)}|${correo}`;
};

export const limiteLogin = limitador({
  ventanaMin: 15,
  maximo: 10,
  mensaje: 'Demasiados intentos de inicio de sesión.',
  clave: ipYCorreo
});

export const limiteRegistro = limitador({
  ventanaMin: 60,
  maximo: 5,
  mensaje: 'Demasiadas cuentas creadas desde esta conexión.'
});

// Cambiar contraseña exige la actual: también se puede intentar adivinar
export const limitePassword = limitador({
  ventanaMin: 15,
  maximo: 5,
  mensaje: 'Demasiados intentos de cambio de contraseña.',
  clave: (req) => `usuario:${req.usuario?.id ?? ipKeyGenerator(req.ip)}`
});

// Tope general para toda la API (uso normal de la app queda muy por debajo)
export const limiteGeneral = limitador({
  ventanaMin: 1,
  maximo: 300,
  mensaje: 'Demasiadas peticiones.'
});
