type AckCopy = { subject: string; body: (name: string) => string };

const copy: Record<string, AckCopy> = {
  en: {
    subject: 'TiLADYS received your message',
    body: (name) => `Hello ${name},\n\nThank you for contacting TiLADYS. We received your message and will review it as soon as possible.\n\nThis is an automatic confirmation, so you do not need to send the same request again.\n\nBest regards,\nTiLADYS\nhttps://tiladys.com`,
  },
  de: {
    subject: 'TiLADYS hat Ihre Nachricht erhalten',
    body: (name) => `Hallo ${name},\n\nvielen Dank für Ihre Nachricht an TiLADYS. Wir haben Ihre Anfrage erhalten und werden sie so schnell wie möglich prüfen.\n\nDies ist eine automatische Bestätigung. Sie müssen dieselbe Anfrage nicht noch einmal senden.\n\nMit freundlichen Grüßen\nTiLADYS\nhttps://tiladys.com`,
  },
  uk: {
    subject: 'TiLADYS отримав ваше повідомлення',
    body: (name) => `Вітаємо, ${name}!\n\nДякуємо, що звернулися до TiLADYS. Ми отримали ваше повідомлення та розглянемо його якомога швидше.\n\nЦе автоматичне підтвердження, тому повторно надсилати той самий запит не потрібно.\n\nЗ повагою,\nTiLADYS\nhttps://tiladys.com`,
  },
  ru: {
    subject: 'TiLADYS получил ваше сообщение',
    body: (name) => `Здравствуйте, ${name}!\n\nСпасибо, что обратились в TiLADYS. Мы получили ваше сообщение и рассмотрим его как можно скорее.\n\nЭто автоматическое подтверждение, поэтому повторно отправлять тот же запрос не нужно.\n\nС уважением,\nTiLADYS\nhttps://tiladys.com`,
  },
  sk: {
    subject: 'TiLADYS prijal vašu správu',
    body: (name) => `Dobrý deň, ${name},\n\nďakujeme, že ste kontaktovali TiLADYS. Vašu správu sme prijali a čo najskôr ju skontrolujeme.\n\nToto je automatické potvrdenie, preto rovnakú požiadavku nemusíte posielať znova.\n\nS pozdravom\nTiLADYS\nhttps://tiladys.com`,
  },
  fr: {
    subject: 'TiLADYS a bien reçu votre message',
    body: (name) => `Bonjour ${name},\n\nMerci d’avoir contacté TiLADYS. Nous avons bien reçu votre message et nous l’examinerons dès que possible.\n\nCeci est une confirmation automatique, il n’est donc pas nécessaire de renvoyer la même demande.\n\nCordialement,\nTiLADYS\nhttps://tiladys.com`,
  },
};

export function contactAcknowledgement(locale: string, name: string) {
  const selected = copy[locale] ?? copy.en;
  return { subject: selected.subject, text: selected.body(name.trim()) };
}
