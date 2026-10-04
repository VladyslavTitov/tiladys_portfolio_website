import nodemailer from 'nodemailer';

type MailOptions = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail({ to, subject, text }: MailOptions) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) throw new Error('SMTP_UNAVAILABLE');
  if (process.env.SMTP_USER && !process.env.SMTP_PASSWORD) throw new Error('SMTP_CREDENTIALS_INCOMPLETE');
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 12_000,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  const result = await transport.sendMail({
    from: process.env.SMTP_FROM,
    replyTo: process.env.SMTP_REPLY_TO || undefined,
    to,
    subject,
    text,
  });
  if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP_REJECTED');
}
