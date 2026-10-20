import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
let local, remote, ready;
export async function query(sql, params=[]) {
 if (process.env.DATABASE_URL) {
  if (!remote) { const { neon } = await import('@neondatabase/serverless'); remote=neon(process.env.DATABASE_URL); }
  let i=0; return await remote.query(sql.replace(/\?/g,()=>'$'+(++i)),params);
 }
 if (process.env.VERCEL) throw new Error('DATABASE_URL must be configured for Vercel');
 if (!local) {
  const { DatabaseSync } = await import('node:sqlite');
  const path=resolve(process.env.DATABASE_PATH||'./data/demo.sqlite'); mkdirSync(dirname(path),{recursive:true});
  local=new DatabaseSync(path); local.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 }
 return local.prepare(sql).all(...params);
}
export async function init() {
 if (!ready) ready=(async()=>{
  const statements=[
   `CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, service TEXT NOT NULL, preferred_date TEXT NOT NULL, notes TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL)`,
   `CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, name TEXT NOT NULL, rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), text TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
   `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at BIGINT NOT NULL)`,
   `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at BIGINT NOT NULL)`,
   `CREATE INDEX IF NOT EXISTS bookings_created_idx ON bookings(created_at)`,
   `CREATE INDEX IF NOT EXISTS reviews_public_idx ON reviews(published, created_at)`
  ];
  for(const statement of statements) await query(statement);
 })().catch(error=>{ready=undefined;throw error});
 return ready;
}
export async function rateLimit(key,limit=20,window=900000) {
 await init(); const now=Date.now();
 const rows=await query(`INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at < ? THEN 1 ELSE rate_limits.count+1 END, expires_at=CASE WHEN rate_limits.expires_at < ? THEN ? ELSE rate_limits.expires_at END RETURNING count`,[key,now+window,now,now,now+window]);
 return Number(rows[0].count)<=limit;
}
export async function addBooking(data) {
 await init(); const id=randomUUID();
 await query(`INSERT INTO bookings(id,name,email,phone,service,preferred_date,notes,status,created_at) VALUES(?,?,?,?,?,?,?,'new',?)`,[id,data.name,data.email,data.phone,data.service,data.preferredDate,data.notes,new Date().toISOString()]);return id;
}
export async function addReview(data) {
 await init();const id=randomUUID();await query(`INSERT INTO reviews(id,name,rating,text,published,created_at) VALUES(?,?,?,?,0,?)`,[id,data.name,data.rating,data.text,new Date().toISOString()]);return id;
}
export async function closeDB(){if(local){local.close();local=undefined;}ready=undefined;}
