import {db} from '@tiladys/db';
import {ControlToolbar} from '@/components/control-toolbar';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/security';
import { Nav } from '@/components/Nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!await currentUser()) redirect('/login');
  const [unread,due,mailAttention]=await Promise.all([db.contactMessage.count({where:{status:'UNREAD'}}),db.task.count({where:{status:{in:['TODO','IN_PROGRESS']},dueAt:{lte:new Date()}}}),db.emailOutbox.count({where:{state:{in:['UNKNOWN','RECORD_FAILED']}}})]);
  return <div className="dash"><Nav /><main><ControlToolbar unread={unread} due={due} mailAttention={mailAttention}/>{children}</main></div>;
}
