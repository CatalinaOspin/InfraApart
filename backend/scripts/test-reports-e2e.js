/**
 * test-reports-e2e.js — CRUD completo de Reportes Viales (crear/listar/filtrar/
 * detalle/actualizar/estado-con-historial/eliminar) + CORS y /profile, contra
 * Supabase real. Arranca src/server.ts, limpia usuarios e2e al final.
 * Uso: node -r ts-node/register scripts/test-reports-e2e.js
 */
const { spawn } = require('child_process');
const path = require('path');
const { inspect } = require('util');

const backendDir = path.join(__dirname, '..');
const PORT = 3200 + Math.floor(Math.random() * 200);
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
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function jsonOrText(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function api(method, url, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await jsonOrText(res), headers: res.headers };
}

async function main() {
  console.log('\n===== INFRAAPART · TEST E2E REPORTES VIALES =====\n');

  // Limpieza preventiva: reportes y usuarios e2e huérfanos de corridas previas
  const { prisma: dbPrisma } = require('../src/config/database');
  const staleUsers = await dbPrisma.user.findMany({
    where: { email: { startsWith: 'e2e.reports.' } },
    select: { id: true },
  });
  if (staleUsers.length) {
    await dbPrisma.report.deleteMany({ where: { userId: { in: staleUsers.map((u) => u.id) } } });
    await dbPrisma.user.deleteMany({ where: { id: { in: staleUsers.map((u) => u.id) } } });
    console.log(`🧹 Limpieza previa: ${staleUsers.length} usuarios e2e antiguos (y sus reportes) eliminados.`);
  }
  await dbPrisma.$disconnect();

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

    // ===== Preparación: ciudadano + editor externo =====
    const base = `e2e.reports.${Date.now()}`;
    const email1 = `${base}.1@test.com`;
    const email2 = `${base}.2@test.com`;

    let r = await api('POST', '/api/auth/register', {
      body: { full_name: 'Ciudadano E2E Reportes', email: email1, password: 'Password1234', phone: '3001234567' },
    });
    report('registro ciudadano → 201', r.status === 201, `status ${r.status} ${inspect(r.json)}`);
    const citizenId = r.json.data?.user?.id;

    r = await api('POST', '/api/auth/login', { body: { email: email1, password: 'Password1234' } });
    const citizenToken = r.json.data?.token;
    report('login ciudadano → token JWT', r.status === 200 && !!citizenToken);

    r = await api('POST', '/api/auth/register', {
      body: { full_name: 'Editor E2E Reportes', email: email2, password: 'Password1234' },
    });
    report('registro editor (otro ciudadano) → 201', r.status === 201);
    r = await api('POST', '/api/auth/login', { body: { email: email2, password: 'Password1234' } });
    const editorToken = r.json.data?.token;

    const reportBody = {
      title: 'Hueco en la vía principal',
      description: 'Hueco grande que daña los vehículos.',
      damage_type: 'pothole',
      severity_level: 'high',
      latitude: 7.8839,
      longitude: -76.6252,
      location_address: 'Cra 100 # 50-20',
      image_url: 'https://example.com/foto-hueco.jpg',
    };

    // ===== CREATE =====
    r = await api('POST', '/api/reports', { token: citizenToken, body: reportBody });
    const created = r.json.data;
    report('POST /reports autenticado → 201', r.status === 201, `status ${r.status} ${inspect(r.json)}`);
    report('estado inicial = "pending" (Recibido)', created?.status?.name === 'pending', inspect(created?.status));
    report('reference_code con formato IA-YYYYMMDD-XXXXXX', /^IA-\d{8}-[A-Z0-9]{6}$/.test(created?.reference_code ?? ''), created?.reference_code);
    report('user_id asignado desde el JWT', created?.user?.id === citizenId, inspect(created?.user));
    report('categoría derivada de damage_type', created?.category?.name === 'pothole', inspect(created?.category));
    report('DTO sin password_hash', created?.user && !('passwordHash' in created.user), inspect(created?.user));
    const reportId = created?.id;

    r = await api('POST', '/api/reports', { body: reportBody });
    report('POST /reports sin token → 401', r.status === 401, `status ${r.status}`);

    r = await api('POST', '/api/reports', {
      token: citizenToken,
      body: { ...reportBody, damage_type: 'crater_espacial', latitude: 999 },
    });
    report('POST /reports datos inválidos → 400 (Zod)', r.status === 400, `status ${r.status}`);

    // ===== READ: listado, filtros, paginación, detalle =====
    r = await api('GET', '/api/reports', { token: citizenToken });
    report('GET /reports → 200 con paginación', r.status === 200 && !!r.json.pagination, inspect(r.json.pagination));
    report('listado incluye el reporte creado', r.json.data?.some((x) => x.id === reportId), '');

    r = await api('GET', '/api/reports?status=pending', { token: citizenToken });
    report('filtro status=pending incluye el reporte', r.json.data?.some((x) => x.id === reportId), '');

    r = await api('GET', '/api/reports?severity=critical', { token: citizenToken });
    report('filtro severity=critical excluye el reporte (high)', !r.json.data?.some((x) => x.id === reportId), '');

    r = await api('GET', '/api/reports?category=pothole', { token: citizenToken });
    report('filtro category=pothole incluye el reporte', r.json.data?.some((x) => x.id === reportId), '');

    r = await api('GET', '/api/reports?status=inexistente', { token: citizenToken });
    report('filtro inválido → 400', r.status === 400, `status ${r.status}`);

    r = await api('GET', '/api/reports/mine', { token: citizenToken });
    report('GET /reports/mine incluye el reporte del usuario', r.json.data?.some((x) => x.id === reportId), '');

    r = await api('GET', `/api/reports/${reportId}`, { token: citizenToken });
    report('GET /reports/:id → detalle con usuario', r.status === 200 && r.json.data?.user?.full_name === 'Ciudadano E2E Reportes', inspect(r.json.data?.user));
    report('detalle incluye historial (vacío al crear)', Array.isArray(r.json.data?.history) && r.json.data.history.length === 0, inspect(r.json.data?.history));

    r = await api('GET', '/api/reports/999999999', { token: citizenToken });
    report('GET /reports/:id inexistente → 404', r.status === 404, `status ${r.status}`);

    // ===== UPDATE / STATUS / DELETE =====
    r = await api('PATCH', `/api/reports/${reportId}/status`, {
      token: citizenToken,
      body: { status: 'in_review' },
    });
    report('PATCH status como ciudadano → 403', r.status === 403, `status ${r.status}`);

    // Asciende temporalmente al ciudadano a "admin" en la BD y vuelve a loguear:
    // el rol viaja dentro del JWT, por eso se necesita un token fresco.
    const { prisma: adminPrisma } = require('../src/config/database');
    await adminPrisma.user.update({ where: { id: citizenId }, data: { role: 'admin' } });
    r = await api('POST', '/api/auth/login', { body: { email: email1, password: 'Password1234' } });
    const adminToken = r.json.data?.token;
    await adminPrisma.$disconnect();

    r = await api('PATCH', `/api/reports/${reportId}/status`, {
      token: adminToken,
      body: { status: 'in_review', comment: 'Se asigna al equipo de mantenimiento' },
    });
    report('PATCH status como admin → 200', r.status === 200, `status ${r.status} ${inspect(r.json)}`);
    report('estado del reporte ahora = in_review', r.json.data?.status?.name === 'in_review', inspect(r.json.data?.status));

    r = await api('GET', `/api/reports/${reportId}`, { token: adminToken });
    const history = r.json.data?.history ?? [];
    report('historial registra el cambio (con comentario)', history.length === 1 && history[0]?.next?.name === 'in_review' && history[0]?.comment === 'Se asigna al equipo de mantenimiento', inspect(history));

    r = await api('PATCH', `/api/reports/${reportId}/status`, { token: adminToken, body: { status: 'in_review' } });
    report('PATCH mismo estado → 200 (no duplica historial)', r.status === 200 && r.json.message.includes('ya estaba'), r.json.message);
    r = await api('GET', `/api/reports/${reportId}`, { token: adminToken });
    report('historial sigue en 1 registro', r.json.data?.history?.length === 1, inspect(r.json.data?.history?.length));

    r = await api('PATCH', `/api/reports/${reportId}/status`, { token: adminToken, body: { status: 'terminado' } });
    report('PATCH status inválido → 400', r.status === 400, `status ${r.status}`);

    r = await api('PUT', `/api/reports/${reportId}`, {
      token: citizenToken,
      body: { title: 'Hueco en la vía principal (URGENTE)' },
    });
    report('PUT /reports/:id como dueño → 200 (título actualizado)', r.status === 200 && r.json.data?.title?.endsWith('(URGENTE)'), inspect(r.json.data?.title));

    r = await api('PUT', `/api/reports/${reportId}`, { token: editorToken, body: { title: 'Intrusión' } });
    report('PUT /reports/:id ajeno → 403', r.status === 403, `status ${r.status}`);

    r = await api('DELETE', `/api/reports/${reportId}`, { token: citizenToken });
    report('DELETE como ciudadano → 403', r.status === 403, `status ${r.status}`);

    r = await api('DELETE', `/api/reports/${reportId}`, { token: adminToken });
    report('DELETE como admin → 200', r.status === 200, `status ${r.status}`);

    r = await api('GET', `/api/reports/${reportId}`, { token: adminToken });
    report('reporte eliminado → 404', r.status === 404, `status ${r.status}`);

    // ===== CORS + SESSION =====
    const corsRes = await fetch(`${BASE}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
    report('CORS: Access-Control-Allow-Origin = http://localhost:5173', corsRes.headers.get('access-control-allow-origin') === 'http://localhost:5173', corsRes.headers.get('access-control-allow-origin'));

    r = await api('GET', '/api/auth/profile', { token: citizenToken });
    report('GET /auth/profile devuelve al usuario autenticado', r.status === 200 && r.json.data?.email === email1, inspect(r.json.data?.email));

    // ===== RESUMEN =====
    console.log(`\n===== RESULTADO: ${passed} ✅ · ${failed} ❌ =====`);
    if (failures.length) console.log('Fallos: ' + failures.join(' | '));

    // ===== CLEANUP =====
    const { prisma: testPrisma } = require('../src/config/database');
    const users = await testPrisma.user.findMany({
      where: { email: { in: [email1, email2] } },
      select: { id: true },
    });
    if (users.length) {
      await testPrisma.report.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
      const del = await testPrisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
      console.log(`🧹 Limpieza: eliminados ${del.count} usuarios de prueba (y sus reportes).`);
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