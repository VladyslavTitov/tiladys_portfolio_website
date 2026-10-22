// Local synthetic QA only: never reads a production URL, never prints credentials.
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

const containerName = 'tiladys-rebuild-dev-20261013';
const inspected = spawnSync('docker', ['inspect', containerName], { encoding: 'utf8' });
if (inspected.status !== 0) throw Error('The verified local synthetic container must already be running.');
const container = JSON.parse(inspected.stdout)[0];
const binding = container.NetworkSettings.Ports['5432/tcp'];
if (!container.State.Running || container.Config.Image !== 'postgres:17-alpine' || binding?.[0]?.HostIp !== '127.0.0.1' || binding[0].HostPort !== '55432') throw Error('Unexpected synthetic database binding.');
const config = Object.fromEntries(container.Config.Env.map(value => {
  const separator = value.indexOf('=');
  return [value.slice(0, separator), value.slice(separator + 1)];
}));
if (config.POSTGRES_USER !== 'tiladys_test' || !config.POSTGRES_PASSWORD) throw Error('Unexpected synthetic database role.');
const database = new URL('postgresql://127.0.0.1:55432/tiladys_rebuild_test');
database.username = config.POSTGRES_USER; database.password = config.POSTGRES_PASSWORD;
const args = process.argv.slice(2);
const photos = args[0] === '--photos'; if (photos) args.shift();
if (!args.length) throw Error('Supply a command and its arguments.');
const env = {
  ...process.env,
  DATABASE_URL: database.href, DIRECT_URL: database.href, DATABASE_URL_UNPOOLED: database.href, SHADOW_DATABASE_URL: '',
  AUTH_SECRET: crypto.randomBytes(48).toString('hex'), AUTH_IP_HEADER: '',
  CONTACT_RATE_LIMIT_SECRET: crypto.randomBytes(48).toString('hex'), CONTACT_IP_HEADER: '',
  NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3100', CONTROL_URL: 'http://127.0.0.1:3101', SITE_URL: 'http://127.0.0.1:3100',
  CONTROL_ALLOWED_ORIGINS: '', CONTACT_AUTO_REPLY_ENABLED: 'false',
  SMTP_HOST: '', SMTP_USER: '', SMTP_PASSWORD: '', SMTP_FROM: '',
  CONTACT_STORAGE_DRIVER: photos ? 'local-test' : 'disabled', CONTACT_UPLOADS_ENABLED: photos ? 'true' : 'false',
  CONTACT_LOCAL_STORAGE_DIR: '/tmp/tiladys-safe-contact-objects', CONTACT_LOCAL_UPLOAD_URL: 'http://127.0.0.1:3002',
};
const child = spawn(args[0], args.slice(1), { env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', () => { console.error('Could not start the supplied QA command.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
