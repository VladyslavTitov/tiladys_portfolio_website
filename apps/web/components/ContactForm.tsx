'use client';

import { useRef, useState } from 'react';
import { LockKeyhole, Send } from 'lucide-react';
import Link from 'next/link';
import interfaceCopy from '@/content/interface.json';
import { MAX_CONTACT_IMAGES, MAX_CONTACT_IMAGE_BYTES, MAX_CONTACT_TOTAL_BYTES, CONTACT_IMAGE_TYPES } from '@/lib/contact-upload-limits';
import type { PageCopy } from '@/lib/page-copy';

type ContactPayload = {
  website: string;
  name: string;
  email: string;
  service: string;
  message: string;
  locale: string;
  consent: boolean;
};

type ServiceOption = { value: string; label: string };

export function ContactForm({ locale, copy: c, serviceOptions, initialService = '', uploadsEnabled = false }: { uploadsEnabled?: boolean; locale: string; copy: PageCopy['contact']; serviceOptions: ServiceOption[]; initialService?: string }) {
  const ui = interfaceCopy[locale as keyof typeof interfaceCopy] ?? interfaceCopy.en;
  const [state, setState] = useState('');
  const [resultKind, setResultKind] = useState<'idle' | 'submitting' | 'success' | 'validation' | 'security' | 'rate-limit' | 'server' | 'network'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState(initialService);
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

    const files = formData.getAll('images').filter((value): value is File => value instanceof File && value.size > 0);
    let fileError = '';
    if (files.length > MAX_CONTACT_IMAGES || files.some((file) => file.size > MAX_CONTACT_IMAGE_BYTES) || files.reduce((sum, file) => sum + file.size, 0) > MAX_CONTACT_TOTAL_BYTES) fileError = ui.IMAGE_LIMIT;
    else if (files.some((file) => !(CONTACT_IMAGE_TYPES as readonly string[]).includes(file.type))) fileError = ui.IMAGE_TYPE;
    if (fileError) { setState(fileError); setResultKind('validation'); statusRef.current?.focus(); return; }
    const multipart = new FormData();
    multipart.set('payload', JSON.stringify(body));
    files.forEach((file) => multipart.append('images', file));
    setState(c.sending);
    setResultKind('submitting');
    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: files.length ? undefined : { 'Content-Type': 'application/json' },
        body: files.length ? multipart : JSON.stringify(body),
      });
      if (!response.ok) {
        setResultKind(response.status === 400 ? 'validation' : response.status === 403 ? 'security' : response.status === 429 ? 'rate-limit' : 'server');
        const result = await response.json().catch(() => ({}));
        setState(Object.prototype.hasOwnProperty.call(ui, result.code) ? ui[result.code as keyof typeof ui] : c.error);
        statusRef.current?.focus();
        return;
      }
      setState(c.success);
      setResultKind('success');
      form.reset();
      setSelectedService('');
      statusRef.current?.focus();
    } catch {
      setState(c.connectionError);
      setResultKind('network');
      statusRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form id="contact-form" className="contact-form contact-form--visual" onSubmit={submit} aria-busy={submitting}>
      <input name="website" className="trap" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <h2>{c.formTitle}</h2>
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
      <label>
        {c.message}
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} placeholder={c.messagePlaceholder} />
      </label>
      {uploadsEnabled ? <label>{ui.images}<input type="file" name="images" multiple accept={CONTACT_IMAGE_TYPES.join(',')} aria-describedby="contact-image-hint" /><small id="contact-image-hint">{ui.hint}</small></label> : null}
      <label className="check contact-form__consent">
        <input name="consent" type="checkbox" required />
        <span>{c.consent} <Link href={`/${locale}/privacy`}>{ui.privacy}</Link></span>
      </label>
      <button className="primary contact-form__submit" type="submit" disabled={submitting}><Send aria-hidden="true" size={19} />{submitting ? c.sending : c.send}</button>
      <div className="contact-form__secure"><LockKeyhole aria-hidden="true" size={16} />{c.secure}</div>
      <p ref={statusRef} className="contact-form__state" aria-live="polite" tabIndex={-1} data-result={resultKind}>{state}</p>
    </form>
  );
}
