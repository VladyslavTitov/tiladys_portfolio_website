import Image from 'next/image';
import Link from 'next/link';
import { BriefcaseBusiness, Building2, FolderKanban, Gauge, LogOut, MessageSquare, ReceiptText, Tags, UsersRound } from 'lucide-react';

export function Nav() {
  return (
    <aside>
      <Image src="/brand/logo.svg" alt="TiLADYS" width={290} height={69} priority />
      <nav aria-label="Control panel navigation" className="control-nav">
        <Link href="/dashboard"><Gauge size={17} />Dashboard</Link>
        <span className="nav-group">CRM</span>
        <Link href="/dashboard/customers"><UsersRound size={17} />Customers</Link>
        <Link href="/dashboard/companies"><Building2 size={17} />Companies</Link>
        <Link href="/dashboard/messages"><MessageSquare size={17} />Messages</Link>
        <span className="nav-group">Work</span>
        <Link href="/dashboard/service-jobs"><BriefcaseBusiness size={17} />Service jobs</Link>
        <Link href="/dashboard/invoices"><ReceiptText size={17} />Invoices</Link>
        <span className="nav-group">Website</span>
        <Link href="/dashboard/projects"><FolderKanban size={17} />Portfolio</Link>
        <Link href="/dashboard/prices"><Tags size={17} />Prices</Link>
      </nav>
      <form action="/api/auth/logout" method="post">
        <button type="submit"><LogOut aria-hidden="true" />Log out</button>
      </form>
    </aside>
  );
}
