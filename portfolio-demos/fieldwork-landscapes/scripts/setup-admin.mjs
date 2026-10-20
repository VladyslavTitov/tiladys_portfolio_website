import { randomBytes,scryptSync } from 'node:crypto';
import { readFileSync,writeFileSync,existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
const terminal=createInterface({input:process.stdin,output:process.stdout});
try{console.log('Set an administrator password. Input is visible only in your local terminal.');const password=process.env.ADMIN_SETUP_PASSWORD||await terminal.question('Password (12+ characters): ');if(password.length<12||password.length>200)throw new Error('Use 12–200 characters.');const salt=randomBytes(24).toString('hex');const hash=scryptSync(password,salt,64).toString('hex');let env=existsSync('.env.local')?readFileSync('.env.local','utf8'):'';env=env.replace(/^ADMIN_PASSWORD_HASH=.*\n?/gm,'');writeFileSync('.env.local',env.trim()+`\nADMIN_PASSWORD_HASH=${salt}:${hash}\n`,{mode:0o600});console.log('Administrator configured in .env.local. Restart the app.');}finally{terminal.close();}
