import assert from 'node:assert/strict';
import {randomBytes, createCipheriv, pbkdf2Sync, webcrypto} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {decryptDestination, normalizeCode} from '../router.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
function generate(destination) {
  const result = spawnSync(process.execPath,
    [resolve(root, 'scripts/create_access_code.mjs'), destination], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

const routeA = generate('pdf-review/');
const routeB = generate('compliance-traceability/');
const config = {version: 1, routes: [routeA.route, routeB.route]};
for (const [code, expected] of [[routeA.code, 'pdf-review/'], [routeB.code, 'compliance-traceability/']]) {
  assert.match(code, /^(?:[A-HJ-NP-Z2-9]{4}-){3}[A-HJ-NP-Z2-9]{4}$/);
  assert.equal(await decryptDestination(code, config, webcrypto.subtle), expected);
  assert.equal(await decryptDestination(code.toLowerCase().replaceAll('-', ''), config, webcrypto.subtle), expected);
  console.log('PASS:', expected);
}
assert.equal(await decryptDestination('AAAA-BBBB-CCCC-DDDD', config, webcrypto.subtle), null);
assert.equal(await decryptDestination('short', config, webcrypto.subtle), null);
assert.equal(normalizeCode(' aaaa-bbbb cccc-dddd '), 'AAAABBBBCCCCDDDD');
for (const path of ['/pdf-review/', '../outside/', 'https://evil.example/', 'pdf-review']) {
  const generated = spawnSync(process.execPath,
    [resolve(root, 'scripts/create_access_code.mjs'), path], {encoding: 'utf8'});
  assert.notEqual(generated.status, 0, `Must reject ${path}`);
}

// A valid AES payload with a dangerous destination still must not redirect.
const malicious = '../outside/';
const unsafeCode = 'ABCDEFGHJKLMNPQR';
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(unsafeCode, salt, 180_000, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
const data = Buffer.concat([cipher.update(malicious, 'utf8'), cipher.final(), cipher.getAuthTag()]);
const unsafeConfig = {version: 1, routes: [{
  salt: salt.toString('base64url'), iv: iv.toString('base64url'),
  ciphertext: data.toString('base64url')
}]};
assert.equal(await decryptDestination(unsafeCode, unsafeConfig, webcrypto.subtle), null);

const current = JSON.parse(readFileSync(resolve(root, 'routes.json'), 'utf8'));
assert.equal(current.version, 1);
assert.equal(current.routes.length, 2);
for (const row of current.routes) {
  assert.deepEqual(Object.keys(row).sort(), ['ciphertext','iv','salt']);
}
console.log('Alle lokalen Prüfungen erfolgreich.');
