import Image from 'next/image';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export function Nav() {
  return (
    <aside>
      <Image src="/brand/logo.svg" alt="TiLADYS" width={290} height={69} priority />
      <nav aria-label="Control panel navigation">
        <Link href="/dashboard">Overview</Link>
        <Link href="/dashboard/projects">Portfolio</Link>
        <Link href="/dashboard/prices">Prices</Link>
        <Link href="/dashboard/messages">Messages</Link>
      </nav>
      <form action="/api/auth/logout" method="post">
        <button type="submit"><LogOut aria-hidden="true" />Log out</button>
      </form>
    </aside>
  );
}
