import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { crearApp } from './app.js';
import { origenesPermitidos, revisarSecretoJwt } from './config/seguridad.js';
import { verificarToken } from './middlewares/auth.middleware.js';

// Pruebas de seguridad con la app real, sin base de datos:
// solo se usan peticiones que se rechazan antes de llegar a SQL Server.

const SECRETO = 'secreto-de-prueba-con-mas-de-32-caracteres';
let servidor;
let base;

before(async () => {
  process.env.JWT_SECRET = SECRETO;
  const app = crearApp({ CORS_ORIGINS: 'https://fitmetrics.app' });
  await new Promise((listo) => {
    servidor = app.listen(0, listo);
  });
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(() => servidor.close());

const login = (cuerpo) => fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cuerpo)
});

test('agrega encabezados de seguridad y no revela que usa Express', async () => {
  const r = await fetch(`${base}/api/no-existe`);
  assert.equal(r.status, 404);
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(r.headers.get('content-security-policy'));
  assert.ok(r.headers.get('strict-transport-security'));
});

test('CORS solo responde a los orígenes permitidos', async () => {
  const permitido = await fetch(`${base}/api/no-existe`, { headers: { Origin: 'https://fitmetrics.app' } });
  assert.equal(permitido.headers.get('access-control-allow-origin'), 'https://fitmetrics.app');

  const ajeno = await fetch(`${base}/api/no-existe`, { headers: { Origin: 'https://sitio-malicioso.com' } });
  assert.equal(ajeno.headers.get('access-control-allow-origin'), null);
});

test('datos que no son texto en el login dan 400, no un error del servidor', async () => {
  const r = await login({ email: 12345, password: ['a'] });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /obligatorios/);
});

test('bloquea el login después de 10 intentos con el mismo correo', async () => {
  for (let i = 0; i < 10; i++) {
    const r = await login({ email: 'victima@correo.com' });
    assert.equal(r.status, 400, `intento ${i + 1}`);
  }
  const bloqueado = await login({ email: 'victima@correo.com' });
  assert.equal(bloqueado.status, 429);
  assert.match((await bloqueado.json()).error, /Demasiados intentos.*15 minutos/);
  assert.ok(bloqueado.headers.get('ratelimit-policy'));

  // Otra cuenta desde la misma conexión no queda bloqueada
  const otro = await login({ email: 'otra@correo.com' });
  assert.equal(otro.status, 400);
});

test('rechaza contraseñas de más de 72 bytes al registrarse', async () => {
  const r = await fetch(`${base}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Ana', email: 'ana@correo.com', password: 'x'.repeat(73) })
  });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /máximo 72/);
});

test('el token solo se acepta firmado con HS256 y el secreto correcto', () => {
  const probar = (token) => {
    const req = { headers: { authorization: `Bearer ${token}` } };
    let usuario = null;
    try {
      verificarToken(req, {}, () => { usuario = req.usuario; });
    } catch (err) {
      return err.status;
    }
    return usuario;
  };

  assert.deepEqual(probar(jwt.sign({ sub: 7, email: 'a@b.c' }, SECRETO, { algorithm: 'HS256' })), { id: 7, email: 'a@b.c' });
  assert.equal(probar(jwt.sign({ sub: 7 }, SECRETO, { algorithm: 'HS512' })), 401);
  assert.equal(probar(jwt.sign({ sub: 7 }, 'otro-secreto-cualquiera-de-32-caracteres!!')), 401);
  // Token sin firma ("alg": "none")
  const sinFirma = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"sub":7}').toString('base64url')}.`;
  assert.equal(probar(sinFirma), 401);
});

test('exige un JWT_SECRET de al menos 32 caracteres', () => {
  assert.match(revisarSecretoJwt(undefined), /Falta/);
  assert.match(revisarSecretoJwt('corto'), /32 caracteres/);
  assert.equal(revisarSecretoJwt(SECRETO), null);
});

test('lee la lista de orígenes permitidos del .env', () => {
  assert.deepEqual([...origenesPermitidos({ CORS_ORIGINS: ' https://a.com/ , https://b.com,' })], ['https://a.com', 'https://b.com']);
  assert.deepEqual([...origenesPermitidos({})], ['http://localhost:5173']);
});
