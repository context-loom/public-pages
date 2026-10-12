import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const routerCode = readFileSync(resolve(root, 'router.mjs'), 'utf8').replace('void openLink();', 'globalThis.testPromise = openLink();');

function makeToken(path) {
  const generated = spawnSync(process.execPath, [resolve(root, 'scripts/create_deep_link.mjs'), path], {encoding:'utf8'});
  assert.equal(generated.status, 0, generated.stderr);
  return generated.stdout.trim();
}

async function route(url) {
  let replaced = null;
  const display = {textContent: ''};
  const current = new URL(url);
  const location = {
    hash: current.hash,
    href: current.href,
    replace(destination) { replaced = destination; }
  };
  const sandbox = {
    document: {getElementById: () => display},
    window: {location},
    crypto: webcrypto, URL, URLSearchParams, TextDecoder, atob
  };
  vm.runInNewContext(routerCode, sandbox, {filename:'router.mjs'});
  await sandbox.testPromise;
  return {replaced, status:display.textContent};
}

for (const path of ['pdf-review/', 'compliance-traceability/']) {
  const url = makeToken(path);
  const result = await route(url);
  assert.equal(result.replaced, `https://context-loom.github.io/public-pages/${path}`);
  console.log(`OK: ${path}`);
}
const missing = await route('https://context-loom.github.io/public-pages/');
assert.equal(missing.replaced, null);
assert.match(missing.status, /vollständiger Link/);
const invalid = await route('https://context-loom.github.io/public-pages/#go=v1.AA.BB.CC');
assert.equal(invalid.replaced, null);
assert.match(invalid.status, /ungültig/);
for(const path of ['../outside/', 'https://evil.example/', '/outside/']){
  const gen=spawnSync(process.execPath, [resolve(root, 'scripts/create_deep_link.mjs'), path], {encoding:'utf8'});
  assert.notEqual(gen.status, 0);
}
console.log('Deep-link route checks passed');
