import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

export function verificarToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Se requiere iniciar sesión');
  }

  const token = header.slice(7);

  try {
    // Se exige el algoritmo con el que firmamos: así no aceptan tokens "alg: none" ni de otro tipo
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.usuario = { id: payload.sub, email: payload.email };
    next();
  } catch {
    throw new HttpError(401, 'Sesión inválida o expirada');
  }
}