// Local QA driver using installed browsers only; no application dependencies.
import {spawn} from 'node:child_process';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export async function until(check, label, timeout=45000) {
  const end=Date.now()+timeout;
  while(Date.now()<end){try{if(await check())return;}catch{} await sleep(100);}
  throw Error(`Timeout: ${label}`);
}
export async function browserDriver(firefox=false) {
  const profile=await mkdtemp(join(tmpdir(),'tiladys-ui-'));
  const port=firefox?9340:9341;
  const child=spawn(firefox?'firefox':'google-chrome',firefox?
    ['--headless','--no-remote','--profile',profile,'--remote-debugging-port',String(port),'about:blank']:
    ['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
  let socket;
  const close=async()=>{socket?.close();child.kill('SIGTERM');await sleep(400);await rm(profile,{recursive:true,force:true,maxRetries:5});};
  try {
    let url;
    if(firefox){url=`ws://127.0.0.1:${port}/session`;await until(async()=>{const s=new WebSocket(url);return await new Promise(resolve=>{s.onopen=()=>{s.close();resolve(true)};s.onerror=()=>resolve(false)});},'Firefox BiDi');}
    else {await until(async()=>{const r=await fetch(`http://127.0.0.1:${port}/json`);const targets=await r.json();url=targets.find(t=>t.type==='page')?.webSocketDebuggerUrl;return !!url;},'Chrome CDP');}
    socket=new WebSocket(url);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
    let id=0;const pending=new Map();const errors=[],network=[];
    socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.method==='log.entryAdded'&&m.params.type==='javascript'&&m.params.level==='error')errors.push({text:m.params.text,stack:m.params.stackTrace});if(m.method==='Network.responseReceived'&&m.params.response.status>=400)network.push({url:m.params.response.url,status:m.params.response.status});if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(p)m.error?p.reject(Error(JSON.stringify(m))):p.resolve(m.result);}};
    const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
    let context;
    if(firefox){await send('session.new',{capabilities:{alwaysMatch:{}}});context=(await send('browsingContext.getTree')).contexts[0].context;await send('session.subscribe',{events:['log.entryAdded']});}
    else {await send('Page.enable');await send('Runtime.enable');await send('Network.enable');}
    const evaluate=async expression=>{
      if(firefox){const r=await send('script.evaluate',{expression:`(async()=>JSON.stringify(await (${expression})))()`,target:{context},awaitPromise:true});if(r.type==='exception')throw Error(JSON.stringify(r.exceptionDetails));return JSON.parse(r.result.value);}
      const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;
    };
    return {send,evaluate,errors,network,close,
      viewport:async(width,height=1000)=>firefox?send('browsingContext.setViewport',{context,viewport:{width,height},devicePixelRatio:1}):send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false}),
      cookie:async(name,value)=>firefox?send('storage.setCookie',{cookie:{name,value:{type:'string',value},domain:'127.0.0.1',path:'/',sameSite:'strict'}}):send('Network.setCookie',{name,value,url:'http://127.0.0.1:3101',sameSite:'Strict',httpOnly:true}),
      navigate:async url=>{if(firefox)await send('browsingContext.navigate',{context,url,wait:'complete'});else await send('Page.navigate',{url});await until(()=>evaluate(`location.href===${JSON.stringify(url)} && document.readyState==='complete' && !!document.querySelector('h1')`),url);await evaluate('document.fonts.ready.then(()=>true)');await evaluate(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{})})).then(()=>true)`);await sleep(200);},
      screenshot:async(full=true)=>{const r=firefox?await send('browsingContext.captureScreenshot',{context,origin:full?'document':'viewport',format:{type:'image/png'}}):await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:full});return Buffer.from(r.data,'base64');}
    };
  } catch(e){await close();throw e;}
}
