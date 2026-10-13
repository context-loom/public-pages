/**
 * URL obfuscation for static public demos, NOT authorization.
 * The same passcode decrypts a map of project IDs to relative destinations.
 * Code input and #secret=... links share the same browser-side processing.
 */
const ITERATIONS = 180_000;
const SECRET_PATTERN = /^[A-HJ-NP-Z2-9]{16}$/;
const PATH_PATTERN = /^(?:[a-z0-9_-]+\/)+$/;

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('Invalid encoding');
  }
  const encoded = value.replaceAll('-', '+').replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(encoded), ch => ch.charCodeAt(0));
}

export function normalizeSecret(value) {
  return String(value ?? '').toUpperCase().replace(/[\s-]/g, '');
}

/** Return a plain object with validated relative targets or null. */
export async function decryptTargets(rawSecret, manifest, subtle = globalThis.crypto?.subtle) {
  const secret = normalizeSecret(rawSecret);
  if (!SECRET_PATTERN.test(secret) || manifest?.version !== 2 || !subtle) return null;
  try {
    const salt = decodeBase64Url(manifest.salt);
    const iv = decodeBase64Url(manifest.iv);
    const cipher = decodeBase64Url(manifest.ciphertext);
    if (salt.length !== 16 || iv.length !== 12 || cipher.length <= 16) return null;

    const inputKey = await subtle.importKey(
      'raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey']);
    const key = await subtle.deriveKey(
      {name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS},
      inputKey, {name: 'AES-GCM', length: 256}, false, ['decrypt']);
    const plaintext = await subtle.decrypt({name: 'AES-GCM', iv}, key, cipher);
    const targets = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(plaintext));

    if (!targets || Array.isArray(targets) || typeof targets !== 'object') return null;
    const entries = Object.entries(targets);
    if (entries.length === 0 || entries.length > 30) return null;
    if (!entries.every(([id, path]) =>
      /^[a-z0-9-]+$/.test(id) && typeof path === 'string' && PATH_PATTERN.test(path))) {
      return null;
    }
    return Object.fromEntries(entries);
  } catch {
    return null;
  }
}

/** Validate the resolved destination before attaching it to any anchor. */
export function resolveTarget(path, base) {
  if (typeof path !== 'string' || !PATH_PATTERN.test(path)) return null;
  const destination = new URL(path, base);
  if (destination.origin !== base.origin || !destination.pathname.startsWith(base.pathname) ||
      destination.pathname === base.pathname) return null;
  return destination.href;
}

if (typeof document !== 'undefined') {
  const input = document.getElementById('access-code');
  const form = document.getElementById('access-form');
  const submit = form?.querySelector('button[type="submit"]');
  const status = document.getElementById('status');
  const anchors = [...document.querySelectorAll('[data-route]')];
  const base = new URL('./', window.location.href);

  function lockLinks() {
    for (const a of anchors) {
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      a.textContent = 'Code erforderlich';
    }
  }

  async function unlock(secret, updateUrl = false) {
    if (!status || !submit || !input) return;
    lockLinks();
    status.textContent = 'Code wird geprüft …';
    submit.disabled = true;
    try {
      const response = await fetch('./routes.json', {cache: 'no-store'});
      if (!response.ok) throw new Error('Routes unavailable');
      const targets = await decryptTargets(secret, await response.json());
      if (!targets) {
        status.textContent = 'Code nicht erkannt.';
        return;
      }
      let count = 0;
      for (const anchor of anchors) {
        const href = resolveTarget(targets[anchor.dataset.route], base);
        if (!href) continue;
        anchor.href = href;
        anchor.removeAttribute('aria-disabled');
        anchor.textContent = 'Öffnen →';
        count += 1;
      }
      if (!count) throw new Error('No known targets');
      status.textContent = count + ' Anwendungen verfügbar.';
      if (updateUrl) {
        window.history.replaceState(null, '', '#secret=' + encodeURIComponent(normalizeSecret(secret)));
      }
    } catch {
      lockLinks();
      status.textContent = 'Die Anwendungen konnten nicht geladen werden.';
    } finally {
      submit.disabled = false;
    }
  }

  form?.addEventListener('submit', event => {
    event.preventDefault();
    void unlock(input.value, true);
  });

  const secretFromUrl = new URLSearchParams(window.location.hash.slice(1)).get('secret');
  if (secretFromUrl) {
    input.value = secretFromUrl;
    void unlock(secretFromUrl);
  } else {
    lockLinks();
  }
}
