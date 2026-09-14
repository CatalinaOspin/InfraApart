/**
 * fix-env-passwords.js
 * Utilidad de saneamiento de credenciales en conexiones Prisma/Supabase.
 *
 * PROBLEMA:
 *   Supabase genera contraseñas con caracteres reservados en URLs (p. ej.
 *   "[GKuY...]"). En una connection string estos caracteres rompen el
 *   parseo de Prisma, así que la auth falla (P1000) aunque la contraseña
 *   sea correcta. La solución es percent-encoding ("%5B...%5D").
 *
 * USO:
 *   node scripts/fix-env-passwords.js [ruta-a-.env]   (por defecto: .env)
 *
 * Es IDEMPOTENTE: si ya está codificado, no toca nada.
 * No imprime contraseñas (solo longitud y máscara de diagnóstico).
 */
const fs = require('fs');
const path = require('path');

const envFile = path.resolve(process.argv[2] || '.env');

function needsEncoding(pw) {
  return pw !== encodeURIComponent(pw) || /[\[\]@:#?/]/.test(pw);
}

function fixUrl(url) {
  const m = url.match(/^(postgresql:\/\/)([^@]+)(@.*)$/);
  if (!m) return url;
  const userInfo = m[2];
  const colon = userInfo.indexOf(':');
  if (colon < 0) return url;
  const user = userInfo.slice(0, colon);
  const pw = userInfo.slice(colon + 1);
  // Seguridad: si ya contiene "%", asumimos que YA está encodeada.
  // NUNCA doble-codificar (rompería la URL con %25).
  if (!pw || pw.includes('%')) return url;
  if (!needsEncoding(pw)) return url;
  return m[1] + user + ':' + encodeURIComponent(pw) + m[3];
}

const content = fs.readFileSync(envFile, 'utf8');
let changed = false;
const updated = content.replace(
  /^(DATABASE_URL|DIRECT_URL)=(.*)$/gm,
  (line, key, raw) => {
    const noCr = raw.replace(/\r$/, '').trim();
    const quoted = noCr.startsWith('"') || noCr.startsWith("'");
    const quoteChar = quoted ? noCr[0] : '';
    const bare = quoted ? noCr.slice(1, -1) : noCr;
    const fixed = fixUrl(bare);
    if (fixed !== bare) changed = true;
    return quoted
      ? `${key}=${quoteChar}${fixed}${quoteChar}`
      : `${key}=${fixed}`;
  }
);

// Diagnóstico (sin exponer secretos completos)
for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
  const line = (content.match(new RegExp('^' + key + '=(.*)$', 'm')) || [])[1];
  if (!line) {
    console.log(key + ' NO_ENCONTRADO');
    continue;
  }
  const noCr = line.replace(/\r$/, '').trim();
  const quoted = noCr.startsWith('"') || noCr.startsWith("'");
  const bare = quoted ? noCr.slice(1, -1) : noCr;
  const m = bare.match(/^postgresql:\/\/([^@]+)@([^:]+):(\d+)/);
  if (!m) {
    console.log(key + ' FORMATO_INESPERADO');
    continue;
  }
  const ui = m[1];
  const colon = ui.indexOf(':');
  const user = colon >= 0 ? ui.slice(0, colon) : ui;
  const pw = colon >= 0 ? ui.slice(colon + 1) : '';
  const mask =
    pw.length >= 3 ? pw.slice(0, 2) + '***' + pw.slice(-1) : '(corta)';
  console.log(
    key,
    '| host=' + m[2] + ':' + m[3],
    '| user=' + user,
    '| pass_len=' + pw.length,
    '| pass=' + mask,
    '| requiere_codificacion=' + (needsEncoding(pw) ? 'SI' : 'NO')
  );
}

if (changed) {
  fs.writeFileSync(envFile, updated);
  console.log('=> PASSWORDS_CODIFICADOS (percent-encoding aplicado)');
} else {
  console.log('=> SIN_CAMBIOS (no hacía falta codificar)');
}