import Image from 'next/image';

export function PageHero({
  className = '',
  kicker,
  title,
  accentLead,
  accent,
  text,
  image = '/hero/tiladys-hero-objects-transparent.png',
  imageWidth = 1254,
  imageHeight = 1254,
}: {
  className?: string;
  kicker?: string;
  title: string;
  accentLead?: string;
  accent: string;
  text: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
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
          <Image src={image} width={imageWidth} height={imageHeight} sizes="(max-width: 640px) calc(100vw - 84px), (max-width: 900px) 560px, 440px" alt="" priority />
        </div>
      </div>
    </section>
  );
}
