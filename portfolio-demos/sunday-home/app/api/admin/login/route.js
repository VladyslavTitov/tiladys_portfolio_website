import { verifyPassword,createSession,sessionCookie } from '@/lib/auth.mjs';
import { rateLimit } from '@/lib/db.mjs';
import { readBody,errorResponse,InputError } from '@/lib/validation.mjs';
export const runtime='nodejs';
export async function POST(request){try{const body=await readBody(request);if(!process.env.ADMIN_PASSWORD_HASH)throw new InputError('Administrator access has not been configured.',503);if(!await rateLimit('admin:login',8))throw new InputError('Too many attempts. Try again in 15 minutes.',429);if(!verifyPassword(body.password))throw new InputError('Incorrect credentials.',401);const token=await createSession();return Response.json({ok:true},{headers:{'Set-Cookie':sessionCookie(token),'Cache-Control':'no-store'}});}catch(error){return errorResponse(error);}}
