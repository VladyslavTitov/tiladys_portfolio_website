// Uses temporary Playwright tooling, not a runtime dependency. Never clicks external actions.
// CONTACT_PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core/index.mjs node tests/contact-buttons.playwright.mjs before|after
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const phase=process.argv[2];assert.ok(['before','after'].includes(phase));
const modulePath=process.env.CONTACT_PLAYWRIGHT_MODULE||'/tmp/tiladys-contact-playwright/node_modules/playwright-core/index.mjs';
const {chromium}=await import(pathToFileURL(modulePath).href);
const widths=[375,430,768,1280,1440,1920];
const port=process.env.CONTACT_TEST_PORT||'3100';assert.ok(['3100','3110'].includes(port));
const directory=`docs/contact-button-evidence/${phase}`;
try{await access(`${directory}/results.json`);throw Error('Evidence exists; preserve or explicitly archive this stage first.');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({deviceScaleFactor:1,reducedMotion:'reduce'});
const rows=[],errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)requests.push({url:r.url(),status:r.status()});});
const baseline=phase==='after'?JSON.parse(await readFile('docs/contact-button-evidence/before/results.json','utf8')):null;
const failures=[];const check=(v,m)=>{if(!v)failures.push(m);};const near=(a,b)=>Math.abs(a-b)<.6;
try{
 for(const locale of phase==='before'?['en']:['en','de','fr','sk','uk','ru'])for(const width of widths){
  await page.setViewportSize({width,height:1000});
  const response=await page.goto(`http://127.0.0.1:${port}/${locale}/contact`,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{});}));});
  const cards=page.locator('.contact-channel-list .contact-channel');assert.equal(await cards.count(),7);
  const result=await cards.evaluateAll(cards=>{
   const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
   return {overflow:document.documentElement.scrollWidth>innerWidth,spacing:getComputedStyle(cards[0].parentElement).rowGap,cards:cards.map(card=>{
    const a=card.querySelector('a'),icon=a.querySelector('svg'),copy=card.querySelector('.contact-channel__copy'),s=getComputedStyle(a),cs=getComputedStyle(card);
    const range=document.createRange();const text=a.querySelector('span');if(text)range.selectNodeContents(text);else{const node=[...a.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());range.selectNodeContents(node);}
    const textBox=text?text.getBoundingClientRect():range.getBoundingClientRect();const canvas=document.createElement('canvas').getContext('2d');canvas.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;const naturalTextWidth=canvas.measureText(a.textContent.trim()).width;const lines=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
    return{title:card.querySelector('h2').textContent,label:a.textContent.trim(),href:a.getAttribute('href'),target:a.getAttribute('target'),rel:a.getAttribute('rel'),button:rect(a),icon:rect(icon),copy:rect(copy),card:rect(card),text:{x:textBox.x,y:textBox.y,right:textBox.right,bottom:textBox.bottom,width:textBox.width,height:textBox.height,lines:new Set(lines.map(r=>Math.round(r.y))).size,clipped:text?naturalTextWidth>textBox.width+.1:false,fullLabel:a.title},style:{padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],cardPadding:[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft],border:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth],radius:s.borderRadius,font:s.fontSize,weight:s.fontWeight,gap:s.columnGap,minHeight:s.minHeight,whiteSpace:s.whiteSpace}};
   })};
  });
  rows.push({locale,width,...result});
  if(locale==='en'){
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   const box=await page.locator('.contact-channel-list').boundingBox();
   const cdp=await page.context().newCDPSession(page);
   const capture=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...box,scale:1}});
   await writeFile(`${directory}/cards-${width}.png`,Buffer.from(capture.data,'base64'));await cdp.detach();
   await page.screenshot({path:`${directory}/page-${width}.png`,fullPage:true,animations:'disabled'});
  }
  if(phase==='after'){
   const key=`${locale} ${width}`,reference=result.cards[0];
   check(!result.overflow,`${key}: horizontal overflow`);
   const old=baseline.rows.find(r=>r.width===width).cards;
   check(JSON.stringify(result.cards.map(c=>[c.href,c.target,c.rel]))===JSON.stringify(old.map(c=>[c.href,c.target,c.rel])),`${key}: destinations/click attributes changed`);
   result.cards.forEach((c,i)=>{
    const label=`${key} ${c.title}`,a=c.button,t=c.text,icon=c.icon,copy=c.copy;
    check(near(a.width,150)&&near(a.height,44),`${label}: expected 150x44, got ${a.width}x${a.height}`);
    check(near(a.width,reference.button.width)&&near(a.height,reference.button.height),`${label}: unequal size`);
    check(near(a.right,reference.button.right),`${label}: right edge`);
    check(t.lines===1&&c.style.whiteSpace==='nowrap',`${label}: wrapped label`);
    if(locale==='en')check(!t.clipped,`${label}: English label truncated`);
    if(t.clipped)check(t.fullLabel===c.label,`${label}: full translated label unavailable`);
    check(near(icon.width,16)&&near(icon.height,16)&&near(t.x-icon.right,8),`${label}: icon size/gap`);
    check(Math.abs((icon.y+icon.height/2)-(a.y+a.height/2))<1,`${label}: vertical icon alignment`);
    check(Math.abs((t.y+t.height/2)-(a.y+a.height/2))<2,`${label}: vertical text alignment`);
    check(Math.abs((icon.x+t.right)/2-(a.x+a.width/2))<1,`${label}: group centering`);
    check(t.right<=a.right-1&&icon.x>=a.x+1,`${label}: label/icon outside button`);
    check(!(Math.min(a.right,copy.right)>Math.max(a.x,copy.x)+.5&&Math.min(a.bottom,copy.bottom)>Math.max(a.y,copy.y)+.5),`${label}: contact detail overlap`);
    check(c.style.radius==='8px'&&c.style.border.every(v=>v==='1px')&&c.style.minHeight==='44px',`${label}: frame style`);
    for(const k of ['padding','cardPadding','font','weight','gap'])check(JSON.stringify(c.style[k])===JSON.stringify(reference.style[k]),`${label}: inconsistent ${k}`);
    if(i>1)check(near(c.card.y-result.cards[i-1].card.bottom,result.cards[1].card.y-result.cards[0].card.bottom),`${label}: unequal card gap`);
   });
  }
 }
}finally{await writeFile(`${directory}/results.json`,JSON.stringify({phase,tool:'Playwright',version:(await import(pathToFileURL(modulePath.replace('index.mjs','package.json')).href,{with:{type:'json'}})).default.version,rows,failures,errors,requests},null,2));await browser.close();}
if(phase==='after'){assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);}
console.log(JSON.stringify({phase,viewports:rows.length,buttons:rows.length*7,failures,errors,requests}));
