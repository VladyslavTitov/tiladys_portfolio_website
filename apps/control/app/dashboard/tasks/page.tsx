
import {ControlText} from '@/components/control-language';
import {Suspense} from 'react';
import {TaskManager} from './task-manager';
export default function Page(){return <Suspense fallback={<p role="status"><ControlText value={"Loading tasks…"}/></p>}><TaskManager/></Suspense>;}
