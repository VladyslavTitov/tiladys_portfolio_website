import Image from 'next/image';

export function PageHero({
  className = '',
  kicker,
  title,
  accentLead,
  accent,
  text,
  image = '/hero/tiladys-hero.webp',
}: {
  className?: string;
  kicker?: string;
  title: string;
  accentLead?: string;
  accent: string;
  text: string;
  image?: string;
}) {
  return (
    <section className={`visual-page-hero ${className}`.trim()}>
      <div className="visual-page-hero__inner">
        <div className="visual-page-hero__copy">
          {kicker ? <span className="visual-page-hero__kicker">{kicker}</span> : null}
          <h1>{title}</h1>
          <h2>
            {accentLead ? <span>{accentLead} </span> : null}
            <strong>{accent}</strong>
          </h2>
          <p>{text}</p>
        </div>
        <div className="visual-page-hero__visual hero-visual" aria-hidden="true">
          <Image src={image} width={1536} height={1024} sizes="(max-width: 768px) 100vw, 50vw" alt="" priority />
        </div>
      </div>
    </section>
  );
}
