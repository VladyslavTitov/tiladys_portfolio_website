export const business = {
  name: 'TiLADYS', email: 'contact@tiladys.com', phone: '+49 163 7235608', telephone: '+491637235608',
  address: 'Kronenstraße 19, 45479 Mülheim an der Ruhr, Germany',
} as const;
export const businessStructuredData = {
  '@type': 'ProfessionalService', name: business.name, email: business.email, telephone: business.telephone,
  address: { '@type': 'PostalAddress', streetAddress: 'Kronenstraße 19', postalCode: '45479', addressLocality: 'Mülheim an der Ruhr', addressCountry: 'DE' },
  areaServed: ['Mülheim an der Ruhr', 'Nordrhein-Westfalen'],
};

// Profile supplied and confirmed by the owner.
export const threadsUrl = 'https://www.threads.com/@tiladys.de';
export const socialAccounts = [
  { key: 'threads', label: 'Threads', handle: '@tiladys.de', href: threadsUrl, tone: 'blue' },
  { key: 'whatsapp', label: 'WhatsApp', handle: '+49 163 7235608', href: 'https://wa.me/491637235608', tone: 'green' },
  { key: 'telegram', label: 'Telegram', handle: '@tiladys_support', href: 'https://t.me/tiladys_support', tone: 'sky' },
  { key: 'instagram', label: 'Instagram', handle: '@tiladys.de', href: 'https://www.instagram.com/tiladys.de', tone: 'pink' },
] as const;
