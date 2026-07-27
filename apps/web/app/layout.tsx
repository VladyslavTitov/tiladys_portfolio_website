import './globals.css'; import type {Metadata} from 'next';
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL??'https://tiladys.com'),title:{default:'TiLADYS — IT Services & Webdesign',template:'%s | TiLADYS'},description:'Practical IT support, websites, PC services and digital solutions in NRW, Germany.',openGraph:{type:'website',siteName:'TiLADYS'},alternates:{canonical:'/'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html><body>{children}</body></html>}
