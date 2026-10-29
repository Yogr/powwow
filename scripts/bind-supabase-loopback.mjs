// Supabase CLI 2.119 currently sets explicit 0.0.0.0 bindings even with the
// documented loopback Docker-network option. Recreate only this checkout's
// own published containers with identical config/volumes and loopback ports.
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const endpoint = execFileSync('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'], { encoding: 'utf8', windowsHide: true }).trim();
const socketPath = endpoint.startsWith('npipe://') ? endpoint.slice('npipe://'.length).replaceAll('/', '\\') : endpoint.startsWith('unix://') ? endpoint.slice('unix://'.length) : null;
if (!socketPath) throw new Error('Only the local Docker engine is supported for Powwow loopback setup.');

function api(method, path, body) {
  return new Promise((resolveResponse, reject) => {
    const encoded = body === undefined ? null : JSON.stringify(body);
    const request = http.request({ socketPath, method, path: '/v1.43' + path, headers: encoded ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(encoded) } : {} }, response => {
      let data = '';
      response.setEncoding('utf8').on('data', chunk => data += chunk).on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(`Docker ${method} ${path} failed (HTTP ${response.statusCode}); private backup is preserved.`));
        resolveResponse(data ? JSON.parse(data) : null);
      });
    });
    request.on('error', reject);
    request.setTimeout(120000, () => request.destroy(new Error('Docker operation timed out')));
    request.end(encoded);
  });
}

function archive(method, path, buffer) {
  return new Promise((resolveResponse, reject) => {
    const request = http.request({ socketPath, method, path: '/v1.43' + path, headers: buffer ? { 'Content-Type': 'application/x-tar', 'Content-Length': buffer.length } : {} }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk)).on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(new Error('Docker private-file archive transfer failed'));
        resolveResponse(Buffer.concat(chunks));
      });
    });
    request.on('error', reject);
    request.setTimeout(120000, () => request.destroy(new Error('Docker private-file archive transfer timed out')));
    request.end(buffer);
  });
}

const allowed = new Set(['supabase_kong_powwow', 'supabase_studio_powwow', 'supabase_inbucket_powwow', 'supabase_db_powwow']);
const containers = await api('GET', '/containers/json?all=true');
const plans = [];
for (const item of containers) {
  const name = item.Names[0].replace(/^\//, '');
  if (!allowed.has(name)) continue;
  const inspection = await api('GET', `/containers/${item.Id}/json`);
  const labels = inspection.Config.Labels ?? {};
  if (labels['com.supabase.cli.project'] !== 'powwow' || resolve(labels['com.supabase.cli.workdir'] ?? '').toLowerCase() !== root.toLowerCase()) throw new Error(`Refusing to change an unverified container named ${name}`);
  const bindings = inspection.HostConfig.PortBindings ?? {};
  if (Object.values(bindings).every(list => (list ?? []).every(binding => binding.HostIp === '127.0.0.1'))) continue;
  if (!Object.keys(bindings).length) continue;
  plans.push({ name, inspection });
}
if (plans.length) {
  mkdirSync(resolve(root, '.data'), { recursive: true });
  writeFileSync(resolve(root, '.data/supabase-container-backup.private.json'), JSON.stringify(plans, null, 2));
}
plans.sort((a, b) => Number(a.name === 'supabase_db_powwow') - Number(b.name === 'supabase_db_powwow'));
for (const { name, inspection } of plans) {
  const host = { ...inspection.HostConfig, PortBindings: Object.fromEntries(Object.entries(inspection.HostConfig.PortBindings).map(([port, values]) => [port, (values ?? []).map(binding => ({ ...binding, HostIp: '127.0.0.1' }))])) };
  const networks = Object.fromEntries(Object.entries(inspection.NetworkSettings.Networks).map(([network, details]) => [network, { Aliases: (details.Aliases ?? []).filter(alias => !/^[0-9a-f]{12,64}$/.test(alias)) }]));
  // The CLI copies Kong's generated config/certificates into its writable
  // layer rather than mounting a volume. Preserve these before replacement.
  let kongArchive;
  if (name === 'supabase_kong_powwow') {
    kongArchive = await archive('GET', `/containers/${inspection.Id}/archive?path=/home/kong`);
    writeFileSync(resolve(root, '.data/supabase-kong.private.tar'), kongArchive);
  }
  if (inspection.State.Running) await api('POST', `/containers/${inspection.Id}/stop?t=30`);
  await api('DELETE', `/containers/${inspection.Id}?v=false`);
  const created = await api('POST', `/containers/create?name=${encodeURIComponent(name)}`, { ...inspection.Config, Hostname: '', HostConfig: host, NetworkingConfig: { EndpointsConfig: networks } });
  if (kongArchive) await archive('PUT', `/containers/${created.Id}/archive?path=/home&copyUIDGID=true`, kongArchive);
  await api('POST', `/containers/${created.Id}/start`);
  console.log(`${name}: restricted published ports to 127.0.0.1; volumes preserved.`);
}
console.log(plans.length ? 'Powwow Supabase loopback bindings applied.' : 'Powwow Supabase ports already use loopback.');
