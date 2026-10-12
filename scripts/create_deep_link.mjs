#!/usr/bin/env node
/** Generate self-contained AES-GCM obfuscated GitHub Pages deep links.
 * The key is shipped inside the URL fragment: URL concealment, not authorization.
 * No links or secrets are committed or stored by this script.
 */
import {randomBytes, createCipheriv} from 'node:crypto';

const base = process.env.PUBLIC_PAGES_URL || 'https://context-loom.github.io/public-pages/';
const relativePath = process.argv[2];
if (!relativePath || relativePath.startsWith('/') || relativePath.includes('\\') ||
    /^[a-z][a-z0-9+.-]*:/i.test(relativePath) || relativePath.split('/').includes('..')) {
  console.error('Verwendung: node scripts/create_deep_link.mjs <relativer-pfad/>');
  process.exit(2);
}
const baseUrl = new URL(base);
if (baseUrl.protocol !== 'https:' || !baseUrl.pathname.endsWith('/')) {
  throw new Error('PUBLIC_PAGES_URL must be an HTTPS base URL ending with /');
}
const destination = new URL(relativePath, baseUrl);
if (destination.origin !== baseUrl.origin || !destination.pathname.startsWith(baseUrl.pathname) ||
    destination.pathname === baseUrl.pathname) {
  throw new Error('Target outside Pages project root');
}
const iv = randomBytes(12);
const key = randomBytes(32);
const cipher = createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(relativePath, 'utf8'), cipher.final(), cipher.getAuthTag()]);
const token = ['v1', iv.toString('base64url'), encrypted.toString('base64url'), key.toString('base64url')].join('.');
console.log(baseUrl.href + '#go=' + token);
