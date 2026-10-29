import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// A real PostgreSQL cluster, confined to this checkout and loopback.
const databaseDir = resolve('.data/postgres');
mkdirSync(resolve('.data'), { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir, user: 'powwow', password: 'powwow-local-only', port: 55432,
  persistent: true, authMethod: 'scram-sha-256',
  initdbFlags: ['--encoding=UTF8'],
  postgresFlags: ['-h', '127.0.0.1', '-c', 'max_connections=40'],
});
if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
const result = await client.query("SELECT 1 FROM pg_database WHERE datname = 'powwow'");
await client.end();
if (!result.rowCount) await pg.createDatabase('powwow');
console.log('Powwow PostgreSQL ready on 127.0.0.1:55432. Data is persistent in .data/postgres.');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await pg.stop(); process.exit(0); });
setInterval(() => {}, 60000);
