import './globals.css';
import './rebuild.css';
import './refinement.css';
import {cookies} from 'next/headers';
import {ControlLanguage} from '@/components/control-language';
export const metadata={title:'TiLADYS Control',robots:{index:false,follow:false},icons:{icon:'/brand/icon.svg'}};
export default async function Layout({children}:{children:React.ReactNode}){const locale=(await cookies()).get('control_locale')?.value==='de'?'de':'en';return <html lang={locale}><body><ControlLanguage initial={locale}>{children}</ControlLanguage></body></html>;}
