import { init,query,addReview,rateLimit } from '@/lib/db.mjs';
import { readBody,validateReview,errorResponse,InputError } from '@/lib/validation.mjs';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{await init();const reviews=await query('SELECT id,name,rating,text,created_at FROM reviews WHERE published=1 ORDER BY created_at DESC LIMIT 30');return Response.json({reviews},{headers:{'Cache-Control':'no-store'}});}catch(error){return errorResponse(error);}}
export async function POST(request){try{const data=validateReview(await readBody(request));if(!await rateLimit('reviews:global',30))throw new InputError('Too many reviews. Please try again later.',429);const id=await addReview(data);return Response.json({id,message:'Thank you. Your review is saved and awaiting moderation.'},{status:201});}catch(error){return errorResponse(error);}}
