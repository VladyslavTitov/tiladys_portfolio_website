import { AtSign, Instagram, MessageCircleMore, Send } from 'lucide-react';
import { socialAccounts } from '@/lib/business';

export const socialIcons = { threads: AtSign, whatsapp: MessageCircleMore, telegram: Send, instagram: Instagram };

export function SocialLinks() {
  return <>{socialAccounts.map(({ key, label, handle, href }) => {
    const Icon = socialIcons[key];
    return <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={`${label}: ${handle}`}>
      <span className="social-link__icon"><Icon aria-hidden="true" size={18} /></span><span>{label} · {handle}</span>
    </a>;
  })}</>;
}
