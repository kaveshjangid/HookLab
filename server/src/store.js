import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
const file = path.join(dir, 'store.json');
let state = { endpoints: [], requests: [] };
let queue = Promise.resolve();

async function persist() {
  queue = queue.then(async () => {
    await fs.mkdir(dir, { recursive: true });
    const temp = `${file}.tmp`;
    await fs.writeFile(temp, JSON.stringify(state, null, 2), 'utf8');
    await fs.rename(temp, file);
  });
  return queue;
}
export async function initStore() {
  try {
    const data = JSON.parse(await fs.readFile(file, 'utf8'));
    state = { endpoints: Array.isArray(data.endpoints) ? data.endpoints : [], requests: Array.isArray(data.requests) ? data.requests : [] };
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('Store read failed; using fresh store:', e.message);
    state = { endpoints: [], requests: [] };
  }
  if (!state.endpoints.length) {
    state.endpoints.push({ id: 'demo', name: 'Demo endpoint', createdAt: new Date().toISOString() });
    await persist();
  }
}
export function getDashboard() {
  return { endpoints: [...state.endpoints].sort((a,b) => b.createdAt.localeCompare(a.createdAt)), requests: [...state.requests].sort((a,b) => b.receivedAt.localeCompare(a.receivedAt)).slice(0,500) };
}
export async function createEndpoint(name) {
  const endpoint = { id: nanoid(12), name, createdAt: new Date().toISOString() };
  state.endpoints.unshift(endpoint); await persist(); return endpoint;
}
export const findEndpoint = (id) => state.endpoints.find((e) => e.id === id) || null;
export async function deleteEndpoint(id) {
  const old = state.endpoints.length;
  state.endpoints = state.endpoints.filter((e) => e.id !== id);
  state.requests = state.requests.filter((r) => r.endpointId !== id);
  if (old === state.endpoints.length) return false;
  await persist(); return true;
}
export async function clearEndpointRequests(id) {
  state.requests = state.requests.filter((r) => r.endpointId !== id); await persist();
}
export const findRequest = (id) => state.requests.find((r) => r.id === id) || null;
export async function addRequest(request) {
  const saved = { id: nanoid(14), ...request };
  state.requests.unshift(saved);
  if (state.requests.length > 5000) state.requests.length = 5000;
  await persist(); return saved;
}
