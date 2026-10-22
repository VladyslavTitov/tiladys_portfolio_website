import test from 'node:test';
import assert from 'node:assert/strict';
import { contactAcknowledgement } from '../apps/web/lib/contact-acknowledgement.ts';

const expectedSubjects: Record<string, string> = {
  en: 'TiLADYS received your message',
  de: 'TiLADYS hat Ihre Nachricht erhalten',
  uk: 'TiLADYS отримав ваше повідомлення',
  ru: 'TiLADYS получил ваше сообщение',
  sk: 'TiLADYS prijal vašu správu',
  fr: 'TiLADYS a bien reçu votre message',
};

test('contact acknowledgement is localized, plain text and contains no submitted message body', () => {
  for (const [locale, subject] of Object.entries(expectedSubjects)) {
    const mail = contactAcknowledgement(locale, 'Test Customer');
    assert.equal(mail.subject, subject);
    assert.match(mail.text, /Test Customer/);
    assert.match(mail.text, /TiLADYS/);
    assert.match(mail.text, /https:\/\/tiladys\.com/);
    assert.doesNotMatch(mail.text, /<html|<script|style=/i);
  }
});

test('unknown locale falls back to English', () => {
  const mail = contactAcknowledgement('unknown', 'Test Customer');
  assert.equal(mail.subject, expectedSubjects.en);
});
