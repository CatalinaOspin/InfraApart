/**
 * roll-jwt-secret.js
 *
 * Renueva el JWT_SECRET en backend/.env con un valor criptográficamente
 * aleatorio (48 bytes hex). NO imprime el secreto para no contaminar logs.
 * Idempotente: reemplaza la línea existente o la agrega al final.
 *
 * Uso: node scripts/roll-jwt-secret.js
 */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
let content = fs.readFileSync(envPath, 'utf8');

const secret = crypto.randomBytes(48).toString('hex');

if (/^JWT_SECRET=.*$/m.test(content)) {
  content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
} else {
  content += `\nJWT_SECRET=${secret}\n`;
}

fs.writeFileSync(envPath, content);
console.log(
  `JWT_SECRET renovado en .env (${secret.length} chars, valor no mostrado).`
);