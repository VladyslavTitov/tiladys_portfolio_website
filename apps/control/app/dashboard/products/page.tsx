
import {ControlText} from '@/components/control-language';
import {Suspense} from 'react';import {ProductManager} from './product-manager';
export default function Page(){return <Suspense fallback={<p role="status"><ControlText value={"Loading products…"}/></p>}><ProductManager/></Suspense>;}
