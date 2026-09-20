export const business = {
  name: 'TiLADYS', email: 'contact@tiladys.com', phone: '+49 163 7235608', telephone: '+491637235608',
  address: 'Kronenstraße 19, 45479 Mülheim an der Ruhr, Germany',
} as const;
export const businessStructuredData = {
  '@type': 'ProfessionalService', name: business.name, email: business.email, telephone: business.telephone,
  address: { '@type': 'PostalAddress', streetAddress: 'Kronenstraße 19', postalCode: '45479', addressLocality: 'Mülheim an der Ruhr', addressCountry: 'DE' },
  areaServed: ['Mülheim an der Ruhr', 'Nordrhein-Westfalen'],
};

// Enable after the owner confirms that this Threads account belongs to TiLADYS.
export const threadsAccountConfirmed: boolean = false;
export const threadsUrl = 'https://www.threads.net/@tiladys.de';
