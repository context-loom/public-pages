#!/usr/bin/env node
/**
 * Generate one random human-readable code and one encrypted route record.
 * Only the route record is committed to routes.json; the code is distributed
 * separately. This is URL obfuscation, NOT an access-control mechanism.
 * Usage: node scripts/create_access_code.mjs pdf-review/
 */
import {randomInt, randomBytes, pbkdf2Sync, createCipheriv} from 'node:crypto';

const destination = process.argv[2];
if (!destination || !/^(?:[a-z0-9_-]+\/)+$/.test(destination)) {
  console.error('Usage: node scripts/create_access_code.mjs <relative-directory/>');
  process.exit(2);
}
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code = Array.from({length: 16}, () => alphabet[randomInt(alphabet.length)]).join('');
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(code, salt, 180_000, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const payload = Buffer.concat([
  cipher.update(destination, 'utf8'), cipher.final(), cipher.getAuthTag()
]);

console.log(JSON.stringify({
  code: code.match(/.{4}/g).join('-'),
  route: {
    salt: salt.toString('base64url'),
    iv: iv.toString('base64url'),
    ciphertext: payload.toString('base64url')
  }
}, null, 2));
