'use client';

import { useRef, useState } from 'react';
import { LockKeyhole, Send } from 'lucide-react';
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

export function ContactForm({ locale, copy: c, serviceOptions, initialService = '' }: { locale: string; copy: PageCopy['contact']; serviceOptions: ServiceOption[]; initialService?: string }) {
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

    setState(c.sending);
    setResultKind('submitting');
    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setResultKind(response.status === 400 ? 'validation' : response.status === 403 ? 'security' : response.status === 429 ? 'rate-limit' : 'server');
        setState(c.error);
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
      <label className="check contact-form__consent">
        <input name="consent" type="checkbox" required />
        <span>{c.consent}</span>
      </label>
      <button className="primary contact-form__submit" type="submit" disabled={submitting}><Send aria-hidden="true" size={19} />{submitting ? c.sending : c.send}</button>
      <div className="contact-form__secure"><LockKeyhole aria-hidden="true" size={16} />{c.secure}</div>
      <p ref={statusRef} className="contact-form__state" aria-live="polite" tabIndex={-1} data-result={resultKind}>{state}</p>
    </form>
  );
}
