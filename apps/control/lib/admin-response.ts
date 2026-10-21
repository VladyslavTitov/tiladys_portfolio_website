import { NextResponse } from 'next/server';
import { adminError } from './business-records';
export const privateJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export function privateError(error: unknown, code: string) { const e = adminError(error, code); return privateJson(e.body, e.status); }
export function paging(url: URL) { return { page: Math.min(10000, Math.max(1, Math.floor(Number(url.searchParams.get('page'))) || 1)), q: (url.searchParams.get('q') || '').slice(0, 120) }; }

export function dateRange(url:URL, field='createdAt') {
 const from=url.searchParams.get('from'),to=url.searchParams.get('to');
 const valid=(v:string|null)=>v&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))?new Date(`${v}T00:00:00.000Z`):null;
 const lower=valid(from),upper=valid(to);if(upper)upper.setUTCDate(upper.getUTCDate()+1);
 return lower||upper?{[field]:{...(lower?{gte:lower}:{}),...(upper?{lt:upper}:{})}}:{};
}
