const BASE = (import.meta.env.VITE_API_URL || 'https://hooklab-9jck.onrender.com').replace(/\/$/, '');
async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${BASE}${path}`, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } }); }
  catch { throw new Error('Cannot reach HookLab API. Make sure the backend is running.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
export const api = {
  base: BASE,
  dashboard: () => request('/api/dashboard'),
  create: (name) => request('/api/endpoints', { method: 'POST', body: JSON.stringify({ name }) }),
  remove: (id) => request(`/api/endpoints/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  clear: (id) => request(`/api/endpoints/${encodeURIComponent(id)}/requests`, { method: 'DELETE' }),
  sample: (id) => request(`/api/endpoints/${encodeURIComponent(id)}/sample`, { method: 'POST', body: JSON.stringify({ eventType: 'payment.success' }) }),
  replay: (id, destinationUrl) => request(`/api/requests/${encodeURIComponent(id)}/replay`, { method: 'POST', body: JSON.stringify({ destinationUrl }) })
};