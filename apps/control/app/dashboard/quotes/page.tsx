import Link from 'next/link';

import {ControlText} from '@/components/control-language';
import {Suspense} from 'react';import {QuoteManager} from './quote-manager';
export default function Page(){return <><nav className="actions" aria-label="Billing resources"><Link href="/dashboard/quotes" aria-current="page"><ControlText value="Quotes"/></Link><Link href="/dashboard/invoices"><ControlText value="Invoices"/></Link></nav><Suspense fallback={<p role="status"><ControlText value={"Loading quotes…"}/></p>}><QuoteManager/></Suspense></>;}
