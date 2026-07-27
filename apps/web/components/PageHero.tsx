import Image from 'next/image';

export function PageHero({
  className = '',
  kicker,
  title,
  accentLead,
  accent,
  text,
  image,
}: {
  className?: string;
  kicker?: string;
  title: string;
  accentLead?: string;
  accent: string;
  text: string;
  image: string;
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
        <div className="visual-page-hero__visual" aria-hidden="true">
          <Image src={image} width={780} height={430} alt="" priority />
        </div>
      </div>
    </section>
  );
}
