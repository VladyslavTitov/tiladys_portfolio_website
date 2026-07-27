'use client';

import { useEffect, useState } from 'react';
import { LockKeyhole, Send } from 'lucide-react';
import { p } from '@/lib/page-copy';

type ContactPayload = {
  website: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  locale: string;
  consent: boolean;
};

export function ContactForm({ locale }: { locale: string }) {
  const c = p(locale).contact;
  const serviceOptions = c.services as readonly string[];
  const [state, setState] = useState('');
  const [selectedService, setSelectedService] = useState('');

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('service');
    if (requested) setSelectedService(requested.slice(0, 120));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body: ContactPayload = {
      website: String(formData.get('website') ?? ''),
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: '',
      service: String(formData.get('service') ?? ''),
      message: String(formData.get('message') ?? ''),
      locale,
      consent: formData.get('consent') === 'on',
    };

    setState(c.sending);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CONTROL_API_URL ?? 'http://localhost:3001'}/api/public/contact`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      if (!response.ok) {
        setState(c.error);
        return;
      }
      setState(c.success);
      form.reset();
      setSelectedService('');
    } catch {
      setState(c.connectionError);
    }
  }

  return (
    <form id="contact-form" className="contact-form contact-form--visual" onSubmit={submit}>
      <input name="website" className="trap" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <h2>{c.formTitle}</h2>
      <label>
        {c.name}
        <input name="name" required minLength={2} placeholder={c.namePlaceholder} autoComplete="name" />
      </label>
      <label>
        {c.email}
        <input name="email" type="email" required placeholder={c.emailPlaceholder} autoComplete="email" />
      </label>
      <label>
        {c.service}
        <select name="service" value={selectedService} onChange={(event) => setSelectedService(event.target.value)}>
          <option value="">{c.servicePlaceholder}</option>
          {serviceOptions.map((service) => <option key={service} value={service}>{service}</option>)}
          {selectedService && !serviceOptions.includes(selectedService) ? <option value={selectedService}>{selectedService}</option> : null}
        </select>
      </label>
      <label>
        {c.message}
        <textarea name="message" required minLength={10} rows={6} placeholder={c.messagePlaceholder} />
      </label>
      <label className="check contact-form__consent">
        <input name="consent" type="checkbox" required />
        <span>{c.consent}</span>
      </label>
      <button className="primary contact-form__submit" type="submit"><Send aria-hidden="true" size={19} />{c.send}</button>
      <div className="contact-form__secure"><LockKeyhole aria-hidden="true" size={16} />{c.secure}</div>
      <p className="contact-form__state" aria-live="polite">{state}</p>
    </form>
  );
}
