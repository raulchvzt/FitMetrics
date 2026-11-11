import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

export function verificarToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Se requiere iniciar sesión');
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.sub, email: payload.email };
    next();
  } catch {
    throw new HttpError(401, 'Sesión inválida o expirada');
  }
}