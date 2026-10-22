'use client';

import { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import Link from 'next/link';
import interfaceCopy from '@/content/interface.json';
import { MAX_CONTACT_IMAGES, MAX_CONTACT_IMAGE_BYTES, MAX_CONTACT_TOTAL_BYTES, CONTACT_IMAGE_TYPES } from '@/lib/contact-upload-limits';
import {contactFieldCopy} from '@/lib/contact-field-copy';
import type { PageCopy } from '@/lib/page-copy';

type ContactPayload = { requestDetail?:string; phone?:string;requestMode?:string;replyLanguage?:string;publicReference?:string;uploadReservation?:{id:string;capability:string};
  website: string;
  name: string;
  email: string;
  service: string;
  message: string;
  locale: string;
  consent: boolean;
};

type ServiceOption = { value: string; label: string };

export function ContactForm({ locale, copy: c, serviceOptions, initialService = '', initialMode = '', initialDetail = '', publicReference = '', uploadsEnabled = false }: { initialDetail?:string;initialMode?:string;publicReference?:string;uploadsEnabled?: boolean; locale: string; copy: PageCopy['contact']; serviceOptions: ServiceOption[]; initialService?: string }) {
  const fields=contactFieldCopy(locale);
  const ui = interfaceCopy[locale as keyof typeof interfaceCopy] ?? interfaceCopy.en;
  const [state, setState] = useState('');
  const [resultKind, setResultKind] = useState<'idle' | 'submitting' | 'success' | 'validation' | 'security' | 'rate-limit' | 'server' | 'network'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState(initialService);
  const retry = useRef<{payload:string;key:string}|null>(null);
  const uploadRetry = useRef<{signature:string;reservationId:string;capability:string;objects:Array<{id:string;url:string}>;uploaded:boolean}|null>(null);
  const [uploadProgress,setUploadProgress]=useState('');
  const fileInput=useRef<HTMLInputElement>(null);
  const [photoNames,setPhotoNames]=useState<string[]>([]);
  const uploadCancel=useRef<AbortController|null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body: ContactPayload = {
      website: String(formData.get('website') ?? ''),
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      service: String(formData.get('service') ?? ''),
      message: String(formData.get('message') ?? ''),
      locale,
      consent: formData.get('consent') === 'on',
    };

    body.phone=String(formData.get('phone')||'');
    const mode=String(formData.get('requestMode')||'');if(mode)body.requestMode=mode;
    const reply=String(formData.get('replyLanguage')||'');if(reply)body.replyLanguage=reply;
    if(initialDetail&&(selectedService==='websites'&&initialDetail.startsWith('web-')||selectedService==='pc-laptop'&&initialDetail.startsWith('pc-')))body.requestDetail=initialDetail;
    if(publicReference)body.publicReference=publicReference;
    const files = formData.getAll('images').filter((value): value is File => value instanceof File && value.name.length > 0);
    let fileError = '';
    if (files.length > MAX_CONTACT_IMAGES || files.some((file) => file.size < 1 || file.size > MAX_CONTACT_IMAGE_BYTES) || files.reduce((sum, file) => sum + file.size, 0) > MAX_CONTACT_TOTAL_BYTES) fileError = ui.IMAGE_LIMIT;
    else if (files.some((file) => !(CONTACT_IMAGE_TYPES as readonly string[]).includes(file.type))) fileError = ui.IMAGE_TYPE;
    if (fileError) { setState(fileError); setResultKind('validation'); statusRef.current?.focus(); return; }
    setState(c.sending);
    setResultKind('submitting');
    setSubmitting(true);
    try {
      if(files.length){
        const signatures=[];for(const file of files){const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());signatures.push([file.name,file.size,Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')]);}const signature=JSON.stringify(signatures);
        if(!uploadRetry.current||uploadRetry.current.signature!==signature){const reservation=await fetch('/api/contact/uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(files.map(f=>({filename:f.name,mimeType:f.type,size:f.size})))});if(!reservation.ok)throw Error('UPLOAD_FAILED');uploadRetry.current={signature,uploaded:false,...await reservation.json()};}
        const reservation=uploadRetry.current!;uploadCancel.current=new AbortController();
        if(!reservation.uploaded)for(const [index,file] of files.entries()){setUploadProgress(`${index+1} / ${files.length}`);const uploaded=await fetch(reservation.objects[index].url,{method:'PUT',headers:{'Content-Type':file.type,'X-Upload-Capability':reservation.capability},body:file,signal:uploadCancel.current.signal});if(!uploaded.ok)throw Error('UPLOAD_FAILED');}
        reservation.uploaded=true;
        body.uploadReservation={id:reservation.reservationId,capability:reservation.capability};
      }
      const payload=JSON.stringify(body);if(!retry.current||retry.current.payload!==payload)retry.current={payload,key:crypto.randomUUID()};
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': retry.current.key },
        body: payload,
      });
      if (!response.ok) {
        setResultKind(response.status === 400 ? 'validation' : response.status === 403 ? 'security' : response.status === 429 ? 'rate-limit' : 'server');
        const result = await response.json().catch(() => ({}));
        setState(Object.prototype.hasOwnProperty.call(ui, result.code) ? ui[result.code as keyof typeof ui] : c.error);
        statusRef.current?.focus();
        return;
      }
      const result=await response.json();setState(`${c.success}${result.reference?` (${result.reference})`:''}`);retry.current=null;uploadRetry.current=null;setUploadProgress('');
      setResultKind('success');

      statusRef.current?.focus();
    } catch(error) {
      if((error as Error).message==='UPLOAD_FAILED'){setState(locale==='de'?'Foto-Upload fehlgeschlagen. Ihre Eingaben bleiben erhalten. Erneut versuchen oder Fotos bewusst entfernen.':'Photo upload failed. Your input is retained. Retry or explicitly remove photos to send without them.');setResultKind('validation');statusRef.current?.focus();return;}
      setState(c.connectionError);
      setResultKind('network');
      statusRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form id="contact-form" className="contact-form contact-form--visual" onSubmit={submit} aria-busy={submitting}>
      <fieldset disabled={submitting || resultKind==='success'} className="contact-fields">
      <input name="website" className="trap" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <h2>{c.formTitle}</h2>{initialService?<p>{fields.preselected}: {serviceOptions.find(s=>s.value===initialService)?.label}{initialDetail?` · ${initialDetail.replaceAll('-',' ')}`:''}. {fields.change}</p>:null}
      <label>
        {c.name}
        <input name="name" required minLength={2} maxLength={80} placeholder={c.namePlaceholder} autoComplete="name" />
      </label>
      <label>
        {c.email}
        <input name="email" type="email" required maxLength={254} placeholder={c.emailPlaceholder} autoComplete="email" />
      </label>
      <label>
        {c.service}
        <select name="service" value={selectedService} onChange={(event) => setSelectedService(event.target.value)}>
          <option value="">{c.servicePlaceholder}</option>
          {serviceOptions.map((service) => <option key={service.value} value={service.value}>{service.label}</option>)}
        </select>
      </label>
      <label>{fields.phone}<input name="phone" type="tel" maxLength={50} autoComplete="tel" /></label>
      {['3d-printing','pc-laptop'].includes(selectedService)?<label>{fields.mode}<select name="requestMode" key={selectedService} defaultValue={initialMode}><option value="">—</option>{(selectedService==='3d-printing'?['idea','file','batch']:['local','remote']).map(mode=><option key={mode} value={mode}>{fields.modes[mode as keyof typeof fields.modes]}</option>)}</select></label>:null}
      <label>{fields.reply}<select name="replyLanguage" defaultValue=""><option value="">—</option>{['en','de','uk','ru','sk','fr'].map(l=><option key={l}>{l}</option>)}</select></label>
      <label>
        {c.message}
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} placeholder={c.messagePlaceholder} />
      </label>
      {uploadsEnabled ? <label>{ui.images}<input ref={fileInput} onChange={e=>setPhotoNames([...e.target.files||[]].map(f=>f.name))} type="file" name="images" multiple accept={CONTACT_IMAGE_TYPES.join(',')} aria-describedby="contact-image-hint" /><small id="contact-image-hint">{ui.hint}</small></label> : <p className="contact-form__notice">{fields.unavailable}</p>}
      {photoNames.length?<div><ul>{photoNames.map((name,index)=><li key={index}>{name}</li>)}</ul><button type="button" className="secondary" disabled={submitting||resultKind==='success'} onClick={()=>{if(fileInput.current)fileInput.current.value='';setPhotoNames([]);uploadRetry.current=null;setUploadProgress('');}}>{fields.removePhotos}</button></div>:null}
      {uploadProgress?<p role="status">{uploadProgress}<button type="button" onClick={()=>uploadCancel.current?.abort()}>{fields.cancel}</button></p>:null}
      <label className="check contact-form__consent">
        <input name="consent" type="checkbox" required />
        <span>{c.consent} <Link href={`/${locale}/privacy`}>{ui.privacy}</Link></span>
      </label>
      <button className="primary contact-form__submit" type="submit" disabled={submitting}><Send aria-hidden="true" size={19} />{submitting ? c.sending : c.send}</button>
      </fieldset>
      {resultKind==='success'?<button type="button" className="secondary" onClick={e=>{e.currentTarget.form?.reset();setSelectedService(initialService);setPhotoNames([]);setResultKind('idle');setState('');e.currentTarget.form?.querySelector<HTMLInputElement>('[name=name]')?.focus();}}>{({en:'Submit another request',de:'Weitere Anfrage senden',uk:'Надіслати ще один запит',ru:'Отправить ещё один запрос',sk:'Odoslať ďalšiu požiadavku',fr:'Envoyer une autre demande'} as Record<string,string>)[locale]}</button>:null}
      <p ref={statusRef} className="contact-form__state" aria-live="polite" tabIndex={-1} data-result={resultKind}>{state}</p>
    </form>
  );
}
