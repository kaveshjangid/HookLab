import dns from 'node:dns/promises';
import net from 'node:net';

const REDACT = new Set(['authorization','cookie','set-cookie','proxy-authorization','x-api-key','x-auth-token','x-access-token']);
export function sanitizeHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [
    key, REDACT.has(key.toLowerCase()) || key.toLowerCase().includes('secret')
      ? '[REDACTED]' : Array.isArray(value) ? value.join(', ') : String(value)
  ]));
}
function blocked4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a,b] = p;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19));
}
function blocked6(ip) {
  const s = ip.toLowerCase().split('%')[0];
  return s === '::' || s === '::1' || s.startsWith('fc') || s.startsWith('fd') ||
    s.startsWith('fe8') || s.startsWith('fe9') || s.startsWith('fea') || s.startsWith('feb') ||
    s.startsWith('ff') || s.startsWith('::ffff:127.') || s.startsWith('::ffff:10.') || s.startsWith('::ffff:192.168.');
}
export async function validatePublicHttpUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Enter a valid destination URL.'); }
  if (!['http:','https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS destinations are allowed.');
  if (url.username || url.password) throw new Error('URLs containing credentials are not allowed.');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname.endsWith('.local')) throw new Error('Local and private destinations are blocked for safety.');
  const family = net.isIP(url.hostname);
  if (family === 4 && blocked4(url.hostname)) throw new Error('Private or reserved IP destinations are blocked.');
  if (family === 6 && blocked6(url.hostname)) throw new Error('Private or reserved IP destinations are blocked.');
  if (!family) {
    let records;
    try { records = await dns.lookup(url.hostname, { all: true, verbatim: true }); }
    catch { throw new Error('Could not resolve destination hostname.'); }
    if (!records.length || records.some(({address, family:f}) => f === 4 ? blocked4(address) : blocked6(address))) throw new Error('Destination resolves to a private or reserved IP and is blocked.');
  }
  return url;
}
