/**
 * test-frontend-bridge.js
 *
 * Verificación de la comunicación extremo a extremo como la hará el navegador
 * en desarrollo:
 *   1) Vite (puerto 5173) proxya /api ← http://localhost:3001
 *   2) Se ejecuta registro → login → crear reporte → listar → perfil a través
 *      del proxy, y el CORS directo contra el backend desde Origin 5173.
 *   3) Limpia el usuario de prueba creado en la BD.
 *
 * Requisito: backend `npm run dev` (3001) y frontend `npm run dev` (5173).
 * Uso: node scripts/test-frontend-bridge.js   (desde backend/)
 */
const { prisma } = require('../src/config/database');

const PROXY = 'http://localhost:5173/api';
const API = 'http://localhost:3001/api';

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

const jsonOrText = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

async function call(base, method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(base + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await jsonOrText(res), headers: res.headers };
}

async function main() {
  console.log('\n===== INFRAAPART · BRIDGE FRONTEND ↔ BACKEND (Vite proxy + CORS) =====\n');

  // 1) Health a través del proxy de Vite (exactamente lo que usa el navegador)
  let r = await call(PROXY, 'GET', '/health');
  report('Vite proxy → backend: /api/health = ok + db connected', r.status === 200 && r.json.db === 'connected', JSON.stringify(r.json));

  // 2) Registro real a través del proxy
  const email = `e2e.proxy.${Date.now()}@test.com`;
  r = await call(PROXY, 'POST', '/auth/register', {
    body: { full_name: 'E2E Proxy Bridge', email, password: 'Password1234', phone: '3001234567' },
  });
  report('registro vía proxy /api/auth/register → 201 y rol citizen', r.status === 201 && r.json.data?.user?.role === 'citizen', `status ${r.status}`);

  // 3) Login a través del proxy → token
  r = await call(PROXY, 'POST', '/auth/login', { body: { email, password: 'Password1234' } });
  const token = r.json.data?.token;
  report('login vía proxy → token JWT emitido', r.status === 200 && !!token, `status ${r.status}`);

  // 4) Crear reporte a través del proxy (con el token en Authorization)
  r = await call(PROXY, 'POST', '/reports', {
    token,
    body: {
      title: 'Hueco vía proxy de Vite',
      description: 'Creado por la verificación de puente frontend-backend.',
      damage_type: 'crack',
      severity_level: 'low',
      latitude: 7.8839,
      longitude: -76.6252,
      location_address: 'Vía proxy',
    },
  });
  const createdReport = r.json.data;
  report('crear reporte vía proxy → 201, estado "pending"', r.status === 201 && createdReport?.status?.name === 'pending' && /^IA-\d{8}-[A-Z0-9]{6}$/.test(createdReport?.reference_code ?? ''), `status ${r.status} ${JSON.stringify(createdReport?.reference_code)}`);
  const reportId = createdReport?.id;

  // 5) Listar filtrado a través del proxy
  r = await call(PROXY, 'GET', `/reports?status=pending&limit=20`, { token });
  report('listar vía proxy con filtro status=pending', r.status === 200 && r.json.data?.some((x) => x.id === reportId), `total ${r.json.pagination?.total}`);

  // 6) Perfil a través del proxy
  r = await call(PROXY, 'GET', '/auth/profile', { token });
  report('perfil vía proxy /api/auth/profile → email coincide', r.status === 200 && r.json.data?.email === email, JSON.stringify(r.json.data?.email));

  // 7) Sin token: 401 (middleware protege la API también vía proxy)
  r = await call(PROXY, 'GET', '/reports');
  report('lista sin token vía proxy → 401', r.status === 401, `status ${r.status}`);

  // 8) CORS directo contra el backend (Origin del frontend de Vite)
  const cors = await fetch(`${API}/health`, { headers: { Origin: 'http://localhost:5173' } });
  const allowOrigin = cors.headers.get('access-control-allow-origin');
  report('CORS directo backend:3001 → Access-Control-Allow-Origin = 5173', allowOrigin === 'http://localhost:5173', `header: ${allowOrigin}`);

  // ===== Limpieza =====
  const users = await prisma.user.findMany({ where: { email }, select: { id: true } });
  if (users.length) {
    await prisma.report.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    console.log(`🧹 Limpieza: usuario de prueba eliminado (${email}).`);
  }
  await prisma.$disconnect();

  console.log(`\n===== RESULTADO BRIDGE: ${passed} ✅ · ${failed} ❌ =====`);
  if (failures.length) console.log('Fallos: ' + failures.join(' | '));
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});