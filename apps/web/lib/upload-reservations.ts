import crypto from 'node:crypto';
import sharp from 'sharp';
import {open,mkdir,writeFile,unlink} from 'node:fs/promises';
import {join,isAbsolute} from 'node:path';
import {db,Prisma} from '@tiladys/db';
import {MAX_CONTACT_IMAGES,MAX_CONTACT_IMAGE_BYTES,MAX_CONTACT_TOTAL_BYTES,CONTACT_IMAGE_TYPES} from './contact-upload-limits';
import {prepareContactImages} from './contact-images';

export interface PrivatePhotoStorage { put(key:string,bytes:Uint8Array):Promise<void>; get(key:string,maxBytes:number):Promise<Uint8Array>; remove(key:string):Promise<void>; }
// Explicit development adapter. Ephemeral disk is NEVER a production storage provider.
export function localPhotoStorage():PrivatePhotoStorage {
 const root=process.env.CONTACT_LOCAL_STORAGE_DIR;
 if(process.env.NODE_ENV==='production'||process.env.CONTACT_STORAGE_DRIVER!=='local-test'||!root||!isAbsolute(root)||!root.startsWith('/tmp/tiladys-'))throw Error('UPLOAD_PROVIDER_UNAVAILABLE');
 const path=(key:string)=>{if(!/^[a-f0-9]{64}$/.test(key))throw Error('INVALID_STORAGE_KEY');return join(root,key);};
 return {async put(key,bytes){await mkdir(root,{recursive:true,mode:0o700});try { await writeFile(path(key),bytes,{mode:0o600,flag:'wx'}); } catch(error) { if((error as NodeJS.ErrnoException).code!=='EEXIST') throw error; const existing=await this.get(key,MAX_CONTACT_IMAGE_BYTES); if(!Buffer.from(existing).equals(Buffer.from(bytes))) throw Error('IDEMPOTENCY_CONFLICT'); }},async get(key,maxBytes){const file=await open(path(key),'r');try { const info=await file.stat();if(!info.isFile()||info.size>maxBytes)throw Error('INVALID_STORED_SIZE');const bytes=Buffer.alloc(info.size);const result=await file.read(bytes,0,info.size,0);if(result.bytesRead!==info.size)throw Error('INVALID_STORED_SIZE');return bytes; } finally { await file.close(); }},async remove(key){await unlink(path(key)).catch(()=>{});}};
}
export function directUploadsAvailable(){return process.env.NODE_ENV!=='production'&&process.env.CONTACT_STORAGE_DRIVER==='local-test'&&Boolean(process.env.CONTACT_LOCAL_STORAGE_DIR)&&Boolean(process.env.CONTACT_LOCAL_UPLOAD_URL);}
export const capabilityHash=(value:string)=>crypto.createHash('sha256').update(value).digest('hex');
function assertCapability(actual:string,raw:string){const expected=capabilityHash(raw);if(!crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))throw Error('INVALID_UPLOAD_CAPABILITY');}
export async function reservePhotos(metadata:unknown){
 if(!directUploadsAvailable())throw Error('UPLOAD_PROVIDER_UNAVAILABLE');
 if(!Array.isArray(metadata)||metadata.length<1||metadata.length>MAX_CONTACT_IMAGES)throw Error('INVALID_UPLOAD_METADATA');
 const photos=metadata.map(m=>{if(!m||typeof m!=='object'||Object.keys(m).some(k=>!['filename','mimeType','size'].includes(k))||typeof m.filename!=='string'||m.filename.length>200||!(CONTACT_IMAGE_TYPES as readonly string[]).includes(m.mimeType)||!Number.isSafeInteger(m.size)||m.size<1||m.size>MAX_CONTACT_IMAGE_BYTES)throw Error('INVALID_UPLOAD_METADATA');return {filename:m.filename,mimeType:m.mimeType,sourceBytes:m.size,storageKey:crypto.randomBytes(32).toString('hex')};});
 if(photos.reduce((sum,p)=>sum+p.sourceBytes,0)>MAX_CONTACT_TOTAL_BYTES)throw Error('INVALID_UPLOAD_METADATA');
 const capability=crypto.randomBytes(32).toString('base64url');
 const reservation=await db.uploadReservation.create({data:{capabilityHash:capabilityHash(capability),purpose:'CONTACT_PHOTOS',expiresAt:new Date(Date.now()+15*60000),objects:{create:photos}},include:{objects:true}});
 return {reservationId:reservation.id,capability,expiresAt:reservation.expiresAt,objects:reservation.objects.map(o=>({id:o.id,url:`${process.env.CONTACT_LOCAL_UPLOAD_URL}/photos/${o.id}`}))};
}
export async function processPhoto(objectId:string,capability:string,bytes:Uint8Array){
 const storage=localPhotoStorage();
 const object=await db.mediaObject.findUniqueOrThrow({where:{id:objectId},include:{reservation:true}});assertCapability(object.reservation.capabilityHash,capability);
 if(object.reservation.purpose!=='CONTACT_PHOTOS'||object.reservation.expiresAt<new Date()||object.reservation.claimedAt||bytes.length!==object.sourceBytes)throw Error('INVALID_UPLOAD_STATE');
 const [image]=await prepareContactImages([new File([bytes as Uint8Array<ArrayBuffer>],object.filename,{type:object.mimeType})]);
 const checksum=crypto.createHash('sha256').update(image.data).digest('hex');
 await db.$transaction(async tx=>{await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "UploadReservation" WHERE "id"=${object.reservationId} FOR UPDATE`);const current=await tx.uploadReservation.findUniqueOrThrow({where:{id:object.reservationId}});if(current.claimedAt||current.expiresAt<new Date())throw Error('INVALID_UPLOAD_STATE');const stored=await tx.mediaObject.findUniqueOrThrow({where:{id:objectId}});if(stored.accepted){if(stored.checksum!==checksum)throw Error('IDEMPOTENCY_CONFLICT');return;}await storage.put(object.storageKey,image.data);await tx.mediaObject.update({where:{id:objectId},data:{accepted:true,checksum}});});
 return {ok:true};
}
export async function finalizedPhotos(tx:Prisma.TransactionClient,id:string,capability:string){
 await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "UploadReservation" WHERE "id"=${id} FOR UPDATE`);
 const r=await tx.uploadReservation.findUniqueOrThrow({where:{id},include:{objects:true}});assertCapability(r.capabilityHash,capability);
 if(r.purpose!=='CONTACT_PHOTOS'||r.expiresAt<new Date()||r.claimedAt||r.objects.length>MAX_CONTACT_IMAGES||r.objects.some(o=>!o.accepted||o.sourceBytes>MAX_CONTACT_IMAGE_BYTES)||r.objects.reduce((s,o)=>s+o.sourceBytes,0)>MAX_CONTACT_TOTAL_BYTES)throw Error('INVALID_UPLOAD_STATE');
 const storage=localPhotoStorage();const result=[];
 for(const [index,o]of r.objects.entries()){const bytes=await storage.get(o.storageKey,MAX_CONTACT_IMAGE_BYTES);if(crypto.createHash('sha256').update(bytes).digest('hex')!==o.checksum)throw Error('INVALID_UPLOAD_CHECKSUM');const meta=await sharp(bytes,{limitInputPixels:1920*1920,failOn:'warning',animated:false}).metadata();if(meta.format!=='webp'||!meta.width||!meta.height||meta.width>1920||meta.height>1920||(meta.pages??1)>1||meta.exif||meta.xmp)throw Error('INVALID_STORED_IMAGE');result.push({filename:`inquiry-image-${index+1}.webp`,mimeType:'image/webp',size:bytes.length,width:meta.width,height:meta.height,data:new Uint8Array(bytes)});}
 if(result.reduce((sum,image)=>sum+image.size,0)>MAX_CONTACT_TOTAL_BYTES)throw Error('INVALID_STORED_SIZE');
 await tx.uploadReservation.update({where:{id},data:{claimedAt:new Date()}});return result;
}
