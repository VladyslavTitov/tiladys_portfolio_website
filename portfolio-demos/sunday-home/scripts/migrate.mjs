import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const { init,closeDB }=await import('../lib/db.mjs');
await init();await closeDB();console.log('Database schema is ready.');
