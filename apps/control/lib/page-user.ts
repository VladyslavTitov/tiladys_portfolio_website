import { redirect } from 'next/navigation';
import { currentUser } from './security';

// Layouts and pages can render concurrently. Guard each data-reading page with
// navigation control flow; API handlers retain requireUser's explicit 401 path.
export async function requirePageUser() {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}
