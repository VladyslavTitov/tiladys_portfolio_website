import { NextRequest,NextResponse } from 'next/server';
import { db } from '@tiladys/db';
import sharp from 'sharp';
export const runtime='nodejs';
const headers={'Cache-Control':'private, no-store','CDN-Cache-Control':'no-store','Vercel-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const image=await db.productImage.findFirst({where:{id:(await params).id,product:{status:'PUBLISHED',rightsConfirmed:true}},select:{data:true,mimeType:true}});if(!image)return new NextResponse('Not found',{status:404,headers});const width=Number(req.nextUrl.searchParams.get('w')||1200);if(!Number.isInteger(width)||width<16||width>1920)return new NextResponse('Invalid size',{status:400,headers});const data=await sharp(image.data,{limitInputPixels:24000000}).rotate().resize({width,withoutEnlargement:true}).webp({quality:80}).toBuffer();return new NextResponse(new Uint8Array(data),{headers:{...headers,'Content-Type':'image/webp'}});}catch{return new NextResponse('Media unavailable',{status:503,headers});}}
