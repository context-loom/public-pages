#!/usr/bin/env node
/**
 * Generate a single encrypted route catalog for the Public Pages index.
 * Usage: node scripts/create_shared_index.mjs pdf-review=pdf-review/ trbs-1115=compliance-traceability/
 * PUBLIC_PAGES_SECRET may be set to retain an existing shared code.
 * The output includes the shared code: do not commit it to public-pages.
 */
import {randomInt, randomBytes, pbkdf2Sync, createCipheriv} from 'node:crypto';

const pattern = /^(?:[a-z0-9_-]+\/)+$/;
const targets = {};
for (const arg of process.argv.slice(2)) {
  const pos = arg.indexOf('=');
  if (pos === -1) throw Error('Expected ID=relative-path/');
  const id = arg.slice(0, pos), path = arg.slice(pos + 1);
  if (!/^[a-z0-9-]+$/.test(id) || !pattern.test(path) || Object.hasOwn(targets, id)) {
    throw Error('Invalid or duplicated route ID or path: ' + arg);
  }
  targets[id] = path;
}
if (!Object.keys(targets).length || Object.keys(targets).length > 30) {
  throw Error('At least one and at most 30 routes required');
}
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const normalize = value => String(value).toUpperCase().replace(/[\s-]/g, '');
const code = process.env.PUBLIC_PAGES_SECRET
  ? normalize(process.env.PUBLIC_PAGES_SECRET)
  : Array.from({length:16}, () => alphabet[randomInt(alphabet.length)]).join('');
if (!/^[A-HJ-NP-Z2-9]{16}$/.test(code)) throw Error('Invalid shared code');
const salt = randomBytes(16), iv = randomBytes(12);
const key = pbkdf2Sync(code, salt, 180_000, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([
  cipher.update(JSON.stringify(targets), 'utf8'), cipher.final(), cipher.getAuthTag()
]);
const manifest = {
  version: 2,
  salt: salt.toString('base64url'),
  iv: iv.toString('base64url'),
  ciphertext: ciphertext.toString('base64url')
};
console.log(JSON.stringify({
  secret: code.match(/.{4}/g).join('-'),
  manifest,
  url: 'https://context-loom.github.io/public-pages/#secret=' + code
}, null, 2));
