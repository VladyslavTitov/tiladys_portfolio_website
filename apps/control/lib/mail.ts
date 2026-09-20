import nodemailer from 'nodemailer';

export async function sendMail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) throw new Error('SMTP_UNAVAILABLE');
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
    connectionTimeout: 10_000, socketTimeout: 20_000,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  const result = await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
  if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP_REJECTED');
}
