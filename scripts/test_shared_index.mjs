import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {decryptTargets, normalizeSecret, resolveTarget} from '../router.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(root, 'routes.json'), 'utf8'));
const knownCode = process.env.PUBLIC_PAGES_SECRET;
assert.equal(manifest.version, 2);
assert(!JSON.stringify(manifest).includes('pdf-review/'));
assert(!JSON.stringify(manifest).includes('compliance-traceability/'));
assert.equal(await decryptTargets('AAAA-BBBB-CCCC-DDDD', manifest, webcrypto.subtle), null);
assert.equal(await decryptTargets('bad', manifest, webcrypto.subtle), null);
assert.equal(normalizeSecret(' abcd-EFGH ijkl-mnop '), 'ABCDEFGHIJKLMNOP');

if (knownCode) {
  const targets = await decryptTargets(knownCode, manifest, webcrypto.subtle);
  assert.deepEqual(targets, { 'pdf-review':'pdf-review/', 'trbs-1115':'compliance-traceability/' });
  const base = new URL('https://context-loom.github.io/public-pages/');
  assert.equal(resolveTarget(targets['pdf-review'], base), base.href + 'pdf-review/');
  assert.equal(resolveTarget(targets['trbs-1115'], base), base.href + 'compliance-traceability/');
}
assert.equal(resolveTarget('../outside/', new URL('https://context-loom.github.io/public-pages/')), null);
assert.equal(resolveTarget('https://elsewhere.example/', new URL('https://context-loom.github.io/public-pages/')), null);

const args=['pdf-review=pdf-review/', 'trbs-1115=compliance-traceability/'];
const generated = spawnSync(process.execPath, [resolve(root, 'scripts/create_shared_index.mjs'), ...args], {encoding:'utf8'});
assert.equal(generated.status, 0, generated.stderr);
const doc = JSON.parse(generated.stdout);
const decrypted = await decryptTargets(doc.secret, doc.manifest, webcrypto.subtle);
assert.deepEqual(decrypted, { 'pdf-review':'pdf-review/', 'trbs-1115':'compliance-traceability/' });
assert(doc.url.includes('#secret='));
const rejected=spawnSync(process.execPath,[resolve(root,'scripts/create_shared_index.mjs'),'x=../outside/'],{encoding:'utf8'});
assert.notEqual(rejected.status,0);
console.log('Shared index tests passed');
