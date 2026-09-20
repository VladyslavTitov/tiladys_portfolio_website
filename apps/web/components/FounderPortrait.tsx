'use client';

import Image from 'next/image';
import { useState } from 'react';

// Supply src="/about/vladyslav-titov.webp" after the owner provides the portrait.
export function FounderPortrait({ name, src }: { name: string; src?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div className="founder-portrait">
    {!loaded && <div className="founder-portrait__fallback" role="img" aria-label={name}><span aria-hidden="true">VT</span></div>}
    {src && !failed && <Image src={src} alt={name} fill sizes="(max-width: 760px) 100vw, 320px" style={{ opacity: loaded ? 1 : 0 }} onLoad={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(false); }} />}
  </div>;
}
