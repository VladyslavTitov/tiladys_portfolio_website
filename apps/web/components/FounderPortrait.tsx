'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

// The owner can add this JPEG without changing the component.
export function FounderPortrait({ name, label, src = "/about/vladyslav-titov.jpeg" }: { name: string; label: string; src?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div className="founder-portrait">
    {!loaded && <div className="founder-portrait__fallback" role="img" aria-label={name}><ImageIcon aria-hidden="true" size={48} strokeWidth={1} /><span>{label}</span></div>}
    {src && !failed && <Image src={src} alt={name} fill sizes="(max-width: 760px) 100vw, 320px" style={{ opacity: loaded ? 1 : 0 }} onLoad={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(false); }} />}
  </div>;
}
