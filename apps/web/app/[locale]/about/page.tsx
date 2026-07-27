import Image from 'next/image';
import {
  Award,
  Boxes,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  FileText,
  Globe2,
  GraduationCap,
  Lightbulb,
  Laptop,
  MessageCircle,
  MessageSquareText,
  MonitorCog,
  Network,
  Server,
  Settings,
  Store,
  UserRound,
  Wrench,
} from 'lucide-react';
import { Shell } from '@/components/Shell';
import aboutContent from '@/content/about.json';

const iconMap = {
  globe: Globe2,
  laptop: Laptop,
  message: MessageSquareText,
  server: Server,
  tools: Wrench,
  store: Store,
  code: Code2,
  wordpress: MonitorCog,
  linux: Settings,
  docker: Boxes,
  network: Network,
  document: FileText,
  chat: MessageCircle,
  user: UserRound,
  idea: Lightbulb,
} as const;

type AboutLocaleContent = (typeof aboutContent)['en'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = ((aboutContent as Record<string, AboutLocaleContent>)[locale] ?? aboutContent.en) as AboutLocaleContent;
  return { title: data.hero.title, description: data.hero.subtitle };
}

function ListCard({ title, items, Icon }: { title: string; items: string[]; Icon: typeof UserRound }) {
  return (
    <article className="about-card about-card--compact">
      <div className="about-card__heading">
        <span className="about-card__heading-icon"><Icon aria-hidden="true" /></span>
        <h2>{title}</h2>
      </div>
      <ul className="about-check-list">
        {items.map((item) => (
          <li key={item}><CheckCircle2 aria-hidden="true" size={18} />{item}</li>
        ))}
      </ul>
    </article>
  );
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = ((aboutContent as Record<string, AboutLocaleContent>)[locale] ?? aboutContent.en) as AboutLocaleContent;

  return (
    <Shell locale={locale}>
      <section className="about-hero">
        <div className="about-hero__inner">
          <div className="about-hero__copy">
            <h1>{data.hero.title}</h1>
            <p>{data.hero.subtitle}</p>
          </div>
          <div className="about-hero__visual">
            <Image src="/portfolio/placeholders/project-4.png" width={856} height={512} alt="TiLADYS laptop workspace" priority />
          </div>
        </div>
      </section>

      <section className="about-page section">
        <div className="about-top-grid">
          <ListCard title={data.whoIAm.title} items={data.whoIAm.items} Icon={UserRound} />

          <article className="about-card about-card--compact about-help-card">
            <div className="about-card__heading">
              <span className="about-card__heading-icon"><BriefcaseBusiness aria-hidden="true" /></span>
              <h2>{data.helpWith.title}</h2>
            </div>
            <div className="about-help-grid">
              {data.helpWith.items.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Wrench;
                return (
                  <div key={item.label} className="about-help-item">
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <ListCard title={data.whyChoose.title} items={data.whyChoose.items} Icon={Award} />
        </div>

        <div className="about-main-grid">
          <article className="about-card">
            <div className="about-card__heading">
              <span className="about-card__heading-icon about-card__heading-icon--filled"><MonitorCog aria-hidden="true" /></span>
              <h2>{data.technical.title}</h2>
            </div>
            <div className="technical-list">
              {data.technical.items.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Code2;
                return (
                  <div key={item.label} className="technical-list__item">
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="about-card">
            <div className="about-card__heading">
              <span className="about-card__heading-icon about-card__heading-icon--large"><GraduationCap aria-hidden="true" /></span>
              <h2>{data.education.title}</h2>
            </div>
            <ol className="education-timeline">
              {data.education.items.map((item) => (
                <li key={`${item.school}-${item.period}`}>
                  <div className="education-timeline__dot" aria-hidden="true" />
                  <h3>{item.school}</h3>
                  <p><span>{item.fieldLabel}:</span> {item.field}</p>
                  <small>{item.period}</small>
                </li>
              ))}
            </ol>
          </article>
        </div>

        <div className="about-bottom-grid">
          <article className="about-card">
            <div className="about-card__heading">
              <span className="about-card__heading-icon"><Globe2 aria-hidden="true" /></span>
              <h2>{data.languages.title}</h2>
            </div>
            <div className="language-skills">
              {data.languages.items.map((item) => (
                <div key={item.name} className="language-skill">
                  <span className="language-skill__flag" aria-hidden="true">{item.flag}</span>
                  <strong>{item.name}</strong>
                  <span>{item.level}</span>
                </div>
              ))}
            </div>
          </article>

          <ListCard title={data.work.title} items={data.work.items} Icon={Settings} />
        </div>

        <div className="about-benefits" aria-label="Service advantages">
          {data.benefits.map((benefit) => {
            const Icon = iconMap[benefit.icon as keyof typeof iconMap] ?? Globe2;
            return (
              <div key={benefit.label} className="about-benefit">
                <Icon aria-hidden="true" />
                <strong>{benefit.label}</strong>
              </div>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
