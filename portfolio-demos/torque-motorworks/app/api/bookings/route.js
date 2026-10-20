import { site } from '@/lib/config';
import { addBooking,rateLimit } from '@/lib/db.mjs';
import { readBody,validateBooking,errorResponse,InputError } from '@/lib/validation.mjs';
export const runtime='nodejs';
export async function POST(request){try{const data=validateBooking(await readBody(request),site.services.map(s=>s[0]));if(!await rateLimit('booking:'+data.email,5)||!await rateLimit('booking:global',100))throw new InputError('Too many requests. Please try again later.',429);const id=await addBooking(data);return Response.json({id,message:'Your request has been saved. This is not a confirmed appointment.'},{status:201});}catch(error){return errorResponse(error);}}
