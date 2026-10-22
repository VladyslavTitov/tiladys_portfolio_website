'use client';

import type { ComponentProps } from 'react';
import { useSearchParams } from 'next/navigation';
import { ContactForm } from './ContactForm';
import { contactContext } from '@/lib/contact-context';

export function ContactFormFromQuery({ serviceAliases, ...props }: ComponentProps<typeof ContactForm> & { serviceAliases: Record<string, string> }) {
  const query = useSearchParams();
  const context = contactContext(query, serviceAliases);
  const key = JSON.stringify(context);
  return <ContactForm key={key} {...props} {...context} />;
}
