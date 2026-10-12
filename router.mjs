/**
 * Stateless deep-link obfuscation router. The decryption key is embedded in the
 * URL fragment along with the ciphertext. This is concealment, NOT access control.
 * Nothing is authenticated server-side. Direct destination URLs remain public.
 *
 * Format: #go=v1.<base64url(12-byte-iv)>.<base64url(ciphertext+tag)>.<base64url(32-byte-key)>
 */
const status = document.getElementById('status');

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding');
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0));
}

async function openLink() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const link = fragment.get('go');
  if (!link) {
    status.textContent = 'Für den Zugriff auf eine Demo wird ein vollständiger Link benötigt.';
    return;
  }
  try {
    if (link.length > 2048) throw new Error('Link too long');
    const parts = link.split('.');
    if (parts.length !== 4 || parts[0] !== 'v1') throw new Error('Unsupported link');
    const nonce = decodeBase64Url(parts[1]);
    const encrypted = decodeBase64Url(parts[2]);
    const keyBytes = decodeBase64Url(parts[3]);
    if (nonce.length !== 12 || encrypted.length < 17 || keyBytes.length !== 32) {
      throw new Error('Invalid payload');
    }
    const key = await crypto.subtle.importKey('raw', keyBytes, {name: 'AES-GCM'}, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv: nonce}, key, encrypted);
    const relativePath = new TextDecoder('utf-8', {fatal: true}).decode(decrypted);

    // Never accept external redirect targets or paths above the Pages project root.
    if (!relativePath || relativePath.startsWith('/') || relativePath.includes('\\') ||
        /^[a-z][a-z0-9+.-]*:/i.test(relativePath) ||
        relativePath.split('/').includes('..')) {
      throw new Error('Invalid target');
    }
    const base = new URL('./', window.location.href);
    const destination = new URL(relativePath, base);
    if (destination.origin !== base.origin || !destination.pathname.startsWith(base.pathname) ||
        destination.pathname === base.pathname) {
      throw new Error('Target outside pages root');
    }
    status.textContent = 'Demo wird geöffnet …';
    window.location.replace(destination.href);
  } catch {
    status.textContent = 'Der Freigabelink ist ungültig oder beschädigt.';
  }
}

void openLink();
