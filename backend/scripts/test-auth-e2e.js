/**
 * test-auth-e2e.js
 *
 * Verificación integral del módulo de autenticación de InfraApart:
 *   1) Arranca el servidor real (ts-node, src/server.ts) leyendo backend/.env.
 *   2) Ejecuta casos de prueba: registro (feliz/duplicado/Zod), inyección de
 *      rol "admin", login, payload JWT (exp 24h) y middleware authenticateToken.
 *   3) Limpia al final los usuarios de prueba creados en la BD.
 *
 * Uso: node -r ts-node/register scripts/test-auth-e2e.js
 */
const { spawn } = require('child_process');
const path = require('path');
const { inspect } = require('util');

const backendDir = path.join(__dirname, '..');
// Puerto aleatorio: el E2E no debe chocar con un `npm run dev` que ya use 3001.
const PORT = 3100 + Math.floor(Math.random() * 200);
const BASE = `http://localhost:${PORT}`;

let passed = 0;
let failed = 0;
const failures = [];

function report(name, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  ✅ ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`  ❌ ${name} ${detail ? '→ ' + detail : ''}`);
  }
}

async function waitForServer(url, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {
      /* servidor aún arrancando */
    }
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

async function main() {
  console.log('\n===== INFRAAPART · TEST E2E AUTENTICACIÓN =====\n');

  // Limpieza preventiva: usuarios e2e huérfanos de corridas anteriores
  const { prisma: dbPrisma } = require('../src/config/database');
  const stale = await dbPrisma.user.deleteMany({
    where: { email: { startsWith: 'e2e.auth.' } },
  });
  if (stale.count) console.log(`🧹 Limpieza previa: ${stale.count} usuarios e2e antiguos eliminados.`);
  await dbPrisma.$disconnect();

  // 1) Arrancar el servidor (PORT explícito para la prueba)
  const child = spawn(process.execPath, ['-r', 'ts-node/register', 'src/server.ts'], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverLog = '';
  child.stdout.on('data', (d) => (serverLog += d));
  child.stderr.on('data', (d) => (serverLog += d));

  try {
    const up = await waitForServer(`${BASE}/api/health`);
    report('Servidor levantado y /api/health responde', up, up ? '' : serverLog.slice(-2000));
    if (!up) {
      console.log('\n--- Log del servidor ---\n' + serverLog.slice(-3000));
      return 1;
    }

    const baseEmail = `e2e.auth.${Date.now()}`;
    const createdEmails = [];
    const throwJson = async (res) => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    };
    const post = (url, body) =>
      fetch(BASE + url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

    // ===== REGISTRO: caso feliz =====
    const email1 = `${baseEmail}@test.com`;
    createdEmails.push(email1);
    let res = await post('/api/auth/register', {
      full_name: 'Ciudadana de Prueba',
      email: email1,
      password: 'Password1234',
      phone: '3001234567',
    });
    let json = await throwJson(res);
    report('register → 201', res.status === 201, `status ${res.status}: ${inspect(json)}`);
    report('register → NO expone password_hash', !('password_hash' in (json?.data?.user ?? {})), inspect(json?.data?.user));
    report('register → rol forzado "citizen"', json?.data?.user?.role === 'citizen', inspect(json?.data?.user?.role));
    report('register → teléfono persistido', json?.data?.user?.phone === '3001234567', inspect(json?.data?.user?.phone));

    // ===== REGISTRO: inyección de rol admin =====
    const email2 = `${baseEmail}.admin@test.com`;
    createdEmails.push(email2);
    res = await post('/api/auth/register', {
      full_name: 'Inyector de Rol',
      email: email2,
      password: 'Password1234',
      role: 'admin', // intento de escalada → debe ignorarse
    });
    json = await throwJson(res);
    report('register con role:"admin" → sigue "citizen"', res.status === 201 && json?.data?.user?.role === 'citizen', `status ${res.status}, role=${json?.data?.user?.role}`);

    // ===== REGISTRO: email duplicado =====
    res = await post('/api/auth/register', { full_name: 'Duplicada', email: email1, password: 'Password1234' });
    report('register duplicado → 409', res.status === 409, `status ${res.status}`);

    // ===== REGISTRO: validación Zod =====
    res = await post('/api/auth/register', {
      full_name: 'Ab', // 2 caracteres
      email: `${baseEmail}.zado@test.com`,
      password: 'Password1234',
    });
    report('register nombre <3 chars → 400', res.status === 400, `status ${res.status}`);

    res = await post('/api/auth/register', {
      full_name: 'Sin Tel',
      email: `${baseEmail}.zado2@test.com`,
      password: 'Password1234',
      phone: '5001234567', // no comienza con 3
    });
    report('register teléfono inválido → 400', res.status === 400, `status ${res.status}`);

    res = await post('/api/auth/register', {
      full_name: 'Sin Pass',
      email: `${baseEmail}.zado3@test.com`,
      password: 'short',
    });
    report('register password <8 → 400', res.status === 400, `status ${res.status}`);

    res = await post('/api/auth/register', { email: 'no-es-email', password: 'Password1234' });
    report('register email inválido → 400', res.status === 400, `status ${res.status}`);

    // ===== LOGIN: caso feliz =====
    res = await post('/api/auth/login', { email: email1, password: 'Password1234' });
    json = await throwJson(res);
    const token = json?.data?.token;
    report('login correcto → 200 con token', res.status === 200 && typeof token === 'string', `status ${res.status}`);
    report('login → rol ciudadano', json?.data?.user?.role === 'citizen', inspect(json?.data?.user?.role));

    // ===== JWT: payload mínimo + expiración 24h =====
    let payload = null;
    let jwtInfo = 'sin token';
    if (token) {
      try {
        payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
        jwtInfo = `exp-iat=${(payload.exp || 0) - (payload.iat || 0)}s`;
      } catch (err) {
        jwtInfo = `decode falló: ${err.message}`;
      }
    }
    report('JWT payload = solo {id, role} (sin email)', payload && 'id' in payload && 'role' in payload && !('email' in payload), `${jwtInfo} ${inspect(payload)}`);
    report('JWT expira en 24h (86400s)', payload && payload.exp - payload.iat === 86400, jwtInfo);

    // ===== LOGIN: fallos =====
    res = await post('/api/auth/login', { email: email1, password: 'PasswordWrong' });
    json = await throwJson(res);
    report('login password incorrecto → 401', res.status === 401, `status ${res.status}`);
    report('login usa mensaje genérico', json?.message === 'Credenciales inválidas', inspect(json?.message));

    res = await post('/api/auth/login', { email: `nadie.${baseEmail}@test.com`, password: 'Password1234' });
    json = await throwJson(res);
    report('login email inexistente → 401', res.status === 401, `status ${res.status}`);
    report('login email inexistente → mismo mensaje genérico', json?.message === 'Credenciales inválidas', inspect(json?.message));

    res = await post('/api/auth/login', { email: 'correo@invalido', password: 'xxxxxxxx' });
    report('login email inválido → 400', res.status === 400, `status ${res.status}`);

    // ===== MIDDLEWARE authenticateToken (in-process) =====
    const { authenticateToken } = require('../src/middlewares/auth');
    const fakeCall = (authorization) =>
      new Promise((resolve) => {
        let done = false;
        const req = { headers: { authorization } };
        const mockRes = {
          statusCode: 0,
          body: null,
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(body) {
            this.body = body;
            return this;
          },
        };
        let calledNext = false;
        authenticateToken(req, mockRes, () => {
          calledNext = true;
        });
        setTimeout(() => {
          if (!done) {
            done = true;
            resolve({ statusCode: mockRes.statusCode, body: mockRes.body, req, calledNext });
          }
        }, 100);
      });

    let m = await fakeCall(undefined);
    report('auth → sin header = 401 sin next()', m.statusCode === 401 && !m.calledNext, inspect(m));

    m = await fakeCall('Bearer token-invalido');
    report('auth → token inválido = 401 sin next()', m.statusCode === 401 && !m.calledNext, inspect(m));

    if (token) {
      m = await fakeCall(`Bearer ${token}`);
      report('auth → token válido llama next() y setea req.user.role', m.calledNext && m.req.user?.role === 'citizen', inspect({ calledNext: m.calledNext, user: m.req.user }));
      report('auth → req.user.id coincide con el payload', m.req.user?.id === payload?.id, inspect({ user: m.req.user, payloadId: payload?.id }));
    }

    // ===== RESUMEN =====
    console.log(`\n===== RESULTADO: ${passed} ✅ · ${failed} ❌ =====`);
    if (failures.length) console.log('Fallos: ' + failures.join(' | '));

    // ===== CLEANUP: eliminar usuarios de prueba de la BD =====
    const { prisma: testPrisma } = require('../src/config/database');
    if (createdEmails.length) {
      const del = await testPrisma.user.deleteMany({ where: { email: { in: createdEmails } } });
      console.log(`🧹 Limpieza: eliminados ${del.count} usuarios de prueba.`);
    }
    await testPrisma.$disconnect();

    return failed === 0 ? 0 : 1;
  } finally {
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 1500);
  }
}

main().then((code) => {
  console.log('');
  process.exit(code);
});