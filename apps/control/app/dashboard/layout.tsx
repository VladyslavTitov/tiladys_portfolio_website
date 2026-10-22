import { dashboardCounts } from '@/lib/dashboard-counts';
import {ControlToolbar} from '@/components/control-toolbar';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/security';
import { Nav } from '@/components/Nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!await currentUser()) redirect('/login');
  const { unread, due, mailAttention } = await dashboardCounts();
  return <div className="dash"><Nav /><main><ControlToolbar unread={unread} due={due} mailAttention={mailAttention}/>{children}</main></div>;
}
