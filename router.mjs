/**
 * Public Pages: client-side destination obfuscation, not access control.
 * The visitor enters a random code. PBKDF2 derives an AES-GCM key that
 * decrypts one relative destination from the public routes.json file.
 * Neither codes nor plaintext targets are embedded in this router.
 */

const ITERATIONS = 180_000;
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{16}$/;
const PATH_PATTERN = /^(?:[a-z0-9_-]+\/)+$/;

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('Invalid route encoding');
  }
  const padded = value.replaceAll('-', '+').replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), ch => ch.charCodeAt(0));
}

export function normalizeCode(value) {
  return String(value ?? '').toUpperCase().replace(/[\s-]/g, '');
}

export async function decryptDestination(rawCode, config, subtle = crypto.subtle) {
  const code = normalizeCode(rawCode);
  if (!CODE_PATTERN.test(code) || config?.version !== 1 ||
      !Array.isArray(config.routes) || config.routes.length > 20) return null;

  const material = await subtle.importKey(
    'raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey']);

  for (const route of config.routes) {
    try {
      const salt = decodeBase64Url(route.salt);
      const iv = decodeBase64Url(route.iv);
      const ciphertext = decodeBase64Url(route.ciphertext);
      if (salt.length !== 16 || iv.length !== 12 || ciphertext.length <= 16) continue;
      const key = await subtle.deriveKey(
        {name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256'},
        material, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
      const plaintext = await subtle.decrypt(
        {name: 'AES-GCM', iv}, key, ciphertext);
      const destination = new TextDecoder('utf-8', {fatal: true}).decode(plaintext);
      if (PATH_PATTERN.test(destination)) return destination;
    } catch {
      // A wrong code cannot decrypt this entry. Check the next one.
    }
  }
  return null;
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('access-form');
  const input = document.getElementById('access-code');
  const status = document.getElementById('status');
  const submit = form?.querySelector('button[type="submit"]');

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!input || !status || !submit) return;
    status.textContent = 'Code wird geprüft …';
    submit.disabled = true;
    try {
      const response = await fetch('./routes.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('Routes unavailable');
      const destination = await decryptDestination(input.value, await response.json());
      if (!destination) {
        status.textContent = 'Code nicht erkannt.';
        return;
      }
      const base = new URL('./', window.location.href);
      const target = new URL(destination, base);
      if (target.origin !== base.origin ||
          !target.pathname.startsWith(base.pathname) ||
          target.pathname === base.pathname) {
        throw new Error('Invalid target');
      }
      status.textContent = 'Anwendung wird geöffnet …';
      window.location.replace(target.href);
    } catch {
      status.textContent = 'Der Code konnte nicht verarbeitet werden.';
    } finally {
      submit.disabled = false;
    }
  });
}
