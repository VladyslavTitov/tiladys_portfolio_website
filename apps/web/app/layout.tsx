import './globals.css'; import type {Metadata} from 'next';
import { headers } from 'next/headers';
export const metadata:Metadata={metadataBase:new URL('https://tiladys.com'),title:{default:'TiLADYS — IT Services & Webdesign',template:'%s | TiLADYS'},description:'Practical IT support, websites, PC services and digital solutions in NRW, Germany.',openGraph:{type:'website',siteName:'TiLADYS'}};
export default async function RootLayout({children}:{children:React.ReactNode}){const locale=(await headers()).get('x-tiladys-locale')??'en';return <html lang={locale}><body>{children}</body></html>}
