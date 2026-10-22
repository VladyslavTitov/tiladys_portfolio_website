'use client';
import { useEffect } from 'react';
/** Covers browser close/reload and same-tab link navigation. Editor switching uses the same prompt. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.hasAttribute('download') || link.target === '_blank' || event.ctrlKey || event.metaKey || link.hash && link.pathname === location.pathname) return;
      if (!confirm('Discard unsaved changes?')) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', unload); document.addEventListener('click', navigate, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true); };
  }, [dirty]);
}
