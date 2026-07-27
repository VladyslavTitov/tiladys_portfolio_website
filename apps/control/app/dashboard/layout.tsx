import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/security';
import { Nav } from '@/components/Nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!await currentUser()) redirect('/login');
  return <div className="dash"><Nav /><main>{children}</main></div>;
}
