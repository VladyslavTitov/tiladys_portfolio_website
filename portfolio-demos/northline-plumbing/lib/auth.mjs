import { randomBytes, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { init,query } from './db.mjs';
export const hashToken=value=>createHash('sha256').update(value).digest('hex');
export function verifyPassword(password,stored=process.env.ADMIN_PASSWORD_HASH){
 if(typeof password!=='string'||password.length>200||!stored)return false;
 try { const [salt,hash]=stored.split(':');const expected=Buffer.from(hash,'hex');const received=scryptSync(password,salt,64);return expected.length===received.length&&timingSafeEqual(expected,received); }catch{return false;}
}
export async function createSession(){await init();const token=randomBytes(32).toString('hex');await query('DELETE FROM sessions WHERE expires_at < ?',[Date.now()]);await query('INSERT INTO sessions(token_hash,expires_at) VALUES(?,?)',[hashToken(token),Date.now()+8*3600000]);return token;}
export function cookieToken(request){return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('admin_session='))?.slice(14)||'';}
export async function isAdmin(request){const token=cookieToken(request);if(!/^[a-f0-9]{64}$/.test(token))return false;await init();return (await query('SELECT token_hash FROM sessions WHERE token_hash=? AND expires_at>?',[hashToken(token),Date.now()])).length>0;}
export function sessionCookie(value,maxAge=28800){return `admin_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.VERCEL||process.env.COOKIE_SECURE==='true'?'; Secure':''}`;}
