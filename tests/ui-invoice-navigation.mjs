import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {browserDriver,until} from './browser-protocol.mjs';
const fixture=JSON.parse(await readFile('/tmp/tiladys-rebuild/browser-fixtures.json','utf8'));
const b=await browserDriver(),checks=[],dir='docs/ui-evidence/invoice-navigation';await mkdir(dir,{recursive:true});
try {
 await b.cookie('tiladys_session',fixture.token);await b.cookie('control_locale','de');b.acceptDialogs(true);
 for(const width of [390,1440]){
  await b.viewport(width);await b.navigate('http://127.0.0.1:3101/dashboard/invoices?status=DRAFT');
  const original=await b.evaluate(`document.querySelector('#invoice-recipientStreet').value`);
  await b.evaluate(`(()=>{const e=document.querySelector('#invoice-recipientStreet');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await until(()=>b.evaluate(`!!document.querySelector('.invoice-requirements a[href="#invoice-recipientStreet"]')`),'recipient validation link');
  await b.evaluate(`document.querySelector('.invoice-fields-group').open=false;document.querySelector('.invoice-requirements a[href="#invoice-recipientStreet"]').click()`);
  await until(()=>b.evaluate(`document.querySelector('.invoice-fields-group').open && document.activeElement.id==='invoice-recipientStreet'`),'validation expands and focuses');
  await writeFile(`${dir}/draft-validation-${width}.png`,await b.screenshot(false));
  await b.evaluate(`(()=>{const e=document.querySelector('#invoice-recipientStreet');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(original)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await b.navigate('http://127.0.0.1:3101/dashboard/invoices?status=ISSUED');assert.equal(await b.evaluate(`document.querySelector('.invoice-fields-group').open`),false);
  await b.evaluate(`document.querySelector('.editor-section-nav a[href="#invoice-lines"]').click()`);assert.ok(await b.evaluate(`document.querySelector('.invoice-fields-group').open && document.querySelector('#recipient').disabled && !document.querySelector('#recipient').contains(document.querySelector('#invoice-payments'))`));
  checks.push(`Draft validation opens/focuses hidden field; issued navigation keeps snapshot locked and payments separate: ${width}px`);
 }
 assert.equal(b.requests.filter(r=>['POST','PUT','PATCH','DELETE'].includes(r.method)).length,0);
}finally{await writeFile(`${dir}/results.json`,JSON.stringify({checks,consoleErrors:b.errors,networkErrors:b.network},null,2));await b.close();}
console.log(JSON.stringify({passed:checks.length,checks}));
