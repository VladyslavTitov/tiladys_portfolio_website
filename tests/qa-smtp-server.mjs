// Loopback-only STARTTLS sink. No relay, forwarding, credentials or outside recipients.
import net from 'node:net';import tls from 'node:tls';import {readFile,writeFile} from 'node:fs/promises';import crypto from 'node:crypto';
const secureContext=tls.createSecureContext({key:await readFile('/tmp/tiladys-complete-qa/smtp-key.pem'),cert:await readFile('/tmp/tiladys-complete-qa/smtp-cert.pem')});
const messages=[];
function attach(socket,encrypted=false){let buffer='',data=false,body='',recipients=[];
 socket.setEncoding('utf8');socket.on('error',()=>{});
 const listener=async chunk=>{buffer+=chunk;let i;while((i=buffer.indexOf('\r\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+2);
  if(data){if(line==='.') {data=false;messages.push({recipients,bytes:Buffer.byteLength(body),sha256:crypto.createHash('sha256').update(body).digest('hex'),tls:encrypted,reply:body.includes('Re: Your TiLADYS request')});await writeFile('docs/qa/evidence/smtp-sink.json',JSON.stringify({loopbackOnly:true,relay:false,messages},null,2));socket.write('250 QA accepted\r\n');body='';}else body+=line+'\r\n';continue;}
  if(/^EHLO|^HELO/.test(line))socket.write(encrypted?'250-localhost\r\n250 SIZE 100000\r\n':'250-localhost\r\n250-STARTTLS\r\n250 SIZE 100000\r\n');
  else if(/^STARTTLS/.test(line)){socket.removeListener('data',listener);socket.write('220 Ready for TLS\r\n',()=>{const upgraded=new tls.TLSSocket(socket,{isServer:true,secureContext});attach(upgraded,true);});return;}
  else if(/^MAIL FROM:/.test(line)){recipients=[];socket.write(encrypted?'250 Sender OK\r\n':'530 TLS required\r\n');}
  else if(/^RCPT TO:/.test(line)){const email=line.match(/<([^>]+)>/)?.[1]||'';if(encrypted&&/^[^@\s]+@example\.test$/i.test(email)){recipients.push(email);socket.write('250 Recipient OK\r\n');}else socket.write('550 Synthetic recipients only\r\n');}
  else if(line==='DATA'){if(!encrypted||!recipients.length)socket.write('550 No recipient\r\n');else{data=true;socket.write('354 End with dot\r\n');}}
  else if(line==='QUIT'){socket.end('221 Bye\r\n');}
  else if(line==='RSET'){recipients=[];body='';data=false;socket.write('250 Reset\r\n');}
  else socket.write('250 OK\r\n');
 }};socket.on('data',listener);
}
const server=net.createServer(s=>{s.write('220 localhost QA SMTP\r\n');attach(s);});server.listen(2525,'127.0.0.1',()=>console.log('Loopback STARTTLS synthetic sink listening on 2525; no relay.'));for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
