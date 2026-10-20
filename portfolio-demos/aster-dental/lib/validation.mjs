export class InputError extends Error { constructor(message,status=400){super(message);this.status=status;} }
const clean=(v,max=200)=>typeof v==='string'?v.trim().slice(0,max):'';
export function validateBooking(body,services){
 const name=clean(body.name,100),email=clean(body.email,254).toLowerCase(),phone=clean(body.phone,40),service=clean(body.service,80),preferredDate=clean(body.preferredDate,10),notes=clean(body.notes,2000);
 if(body.website)throw new InputError('Please leave the website field empty.');
 if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||phone.length<7)throw new InputError('Please enter your name, a valid email and phone number.');
 if(!services.includes(service))throw new InputError('Please choose a listed service.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)||Number.isNaN(Date.parse(preferredDate))||new Date(preferredDate).toISOString().slice(0,10)!==preferredDate||preferredDate<new Date().toISOString().slice(0,10))throw new InputError('Please choose today or a future date.');
 if(body.consent!==true)throw new InputError('Please agree to the privacy notice.');
 return {name,email,phone,service,preferredDate,notes};
}
export function validateReview(body){const name=clean(body.name,100),text=clean(body.text,1000),rating=Number(body.rating);if(name.length<2||text.length<10||!Number.isInteger(rating)||rating<1||rating>5||body.consent!==true||body.website)throw new InputError('Enter a name, a review of at least 10 characters, a rating and your consent.');return {name,text,rating};}
export async function readBody(request){
 const origin=request.headers.get('origin'); const allowed=[new URL(request.url).origin];if(process.env.SITE_URL)allowed.push(new URL(process.env.SITE_URL).origin);
 if(!origin||!allowed.includes(origin))throw new InputError('Request origin is not allowed.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new InputError('JSON is required.',415);
 if(Number(request.headers.get('content-length'))>16384)throw new InputError('Request is too large.',413);
 const reader=request.body?.getReader();if(!reader)throw new InputError('Missing request body.');
 const chunks=[];let length=0;while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>16384){await reader.cancel();throw new InputError('Request is too large.',413);}chunks.push(value);}
 const bytes=Buffer.concat(chunks);try{return JSON.parse(bytes.toString('utf8'));}catch{throw new InputError('Invalid JSON.');}
}
export function errorResponse(error){if(!(error instanceof InputError))console.error('Request failed:',error.message);return Response.json({error:error instanceof InputError?error.message:'The request could not be saved. Please try again.'},{status:error.status||503});}
