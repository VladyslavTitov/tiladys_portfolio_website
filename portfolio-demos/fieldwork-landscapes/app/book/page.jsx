import Booking from '@/components/Booking';import { site } from '@/lib/config';
export const metadata={title:'Request an appointment',description:'Choose a service and send an appointment request.',alternates:{canonical:'/book'}};
export default async function Book({searchParams}){const search=await searchParams;return <main id="main" className="section inner"><p className="eyebrow">{site.city.toUpperCase()} / LET’S MAKE A PLAN</p><h1 className="page-title">Your next step,<br/><em>made simple.</em></h1><Booking initialService={search.service}/></main>}
