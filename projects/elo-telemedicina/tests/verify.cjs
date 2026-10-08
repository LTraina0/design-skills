const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright') : 'playwright');
const root=path.resolve(__dirname,'..');
const assets=path.join(root,'assets');
const base=process.env.ELO_TEST_URL || 'http://127.0.0.1:8000';
const results=[];
const pass=(name)=>results.push({name,result:'PASS'});
function luminance(hex){const a=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*a[0]+.7152*a[1]+.0722*a[2];}
function contrast(a,b){const l=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (l[0]+.05)/(l[1]+.05);}
(async()=>{
 const browser=await chromium.launch({headless:true, ...(process.env.ELO_BROWSER_PATH ? {executablePath:process.env.ELO_BROWSER_PATH}: {})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1020},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/index.html');
  const state=()=>page.locator('.card').getAttribute('data-state');
  assert.equal(await state(),'idle');
  await page.locator('#primary').focus();await page.keyboard.press('Enter');
  assert.equal(await state(),'processing');assert.equal(await page.locator('#primary').getAttribute('aria-disabled'),'true');
  await page.keyboard.press('Enter');await page.keyboard.press('Space');
  assert.equal(await page.locator('#primary').evaluate(el=>el===document.activeElement),true);
  assert.match(await page.locator('#announcement').textContent(),/Confirmando/);
  assert.equal(await page.locator('#announcement').evaluate(el=>!el.closest('[aria-busy="true"]')),true);
  await page.waitForFunction(()=>document.querySelector('.card').dataset.state==='success');
  assert.equal(await page.locator('#primary').evaluate(el=>el===document.activeElement),true);
  pass('Confirmação por teclado, feedback imediato, proteção contra envio repetido e foco preservado');
  const downloadP=page.waitForEvent('download');await page.locator('#primary').click();const download=await downloadP;const calendar=fs.readFileSync(await download.path(),'utf8');
  assert.match(calendar,/DTSTART:20261014T173000Z/);assert.match(calendar,/DTEND:20261014T180000Z/);assert.match(calendar,/DEMONSTRAÇÃO/);assert.equal(await state(),'success');
  pass('Download de calendário fictício com 14h30 Brasília = 17h30 UTC; não reenvia confirmação');
  await page.locator('#scenario').selectOption('error');await page.locator('#primary').click();await page.waitForFunction(()=>document.querySelector('.card').dataset.state==='error');
  assert.match(await page.locator('#error-announcement').textContent(),/não concluída/);assert.match(await page.locator('.appointment').textContent(),/14h30/);
  await page.locator('#primary').click();await page.waitForFunction(()=>document.querySelector('.card').dataset.state==='success');pass('Falha de conexão seguida de retentativa manual e sucesso, com dados preservados');
  await page.locator('#scenario').selectOption('timeout');await page.locator('#primary').click();await page.waitForFunction(()=>document.querySelector('.card').dataset.state==='error',{},{timeout:9000});
  assert.match(await page.locator('#feedback-text').textContent(),/tempo de espera terminou/);pass('Timeout finito de 6,5 s com mensagem específica e recuperação');
  await page.locator('#primary').click();await page.locator('#cancel').click();assert.equal(await state(),'idle');assert.equal(await page.locator('#primary').evaluate(el=>el===document.activeElement),true);
  await page.locator('#scenario').selectOption('success');await page.locator('#primary').click();await page.locator('[data-preview="error"]').click();await page.waitForTimeout(1800);assert.equal(await state(),'error');
  pass('Interrupção retorna foco ao botão; resultado antigo não sobrescreve inspeção posterior');
  await page.locator('[data-preview="idle"]').click();await page.locator('.prepare summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('details').getAttribute('open'),'');await page.keyboard.press('Enter');pass('Disclosure nativo acessível por teclado');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-preview="processing"]').click();assert.equal(await page.locator('.spinner').evaluate(el=>getComputedStyle(el).animationName),'none');pass('Movimento reduzido remove spinner e animações sem ocultar o estado');
  const sizes=await page.locator('button, select, summary').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().height>0).map(el=>({text:el.textContent.trim(),height:el.getBoundingClientRect().height})));
  assert.ok(sizes.every(x=>x.height>=44));pass('Alvos de todos os controles têm altura ≥ 44 CSS px');
  for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:1020});for(const s of ['idle','processing','success','error']){await page.locator(`[data-preview="${s}"]`).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow: ${width}/${s}`);}}
  pass('Sem overflow horizontal em 320, 375, 768 e 1440 px, nos quatro estados');
  const pairs=[['Texto principal','203b34','ffffff'],['Texto secundário','596861','ffffff'],['Texto secundário / papel','596861','f5f4ef'],['Botão','ffffff','1d493e'],['Botão em processamento','ffffff','4c675e'],['Mensagem de erro','853629','fff0eb'],['Foco / branco','8a382b','ffffff'],['Foco / palco','8a382b','e5efdf'],['Texto do sucesso','32552d','eaf4e3']];
  const ratios=pairs.map(([name,a,b])=>({name,ratio:Number(contrast(a,b).toFixed(2))}));assert.ok(ratios.every(x=>x.ratio>=4.5));pass('Pares principais de texto e foco excedem 4,5:1 de contraste');
  await page.setViewportSize({width:1440,height:1020});await page.locator('[data-preview="idle"]').click();await page.screenshot({path:path.join(assets,'prototype-desktop.png'),fullPage:true});
  for(const [s,label] of [['idle','inicial'],['processing','processando'],['success','sucesso'],['error','erro']]){await page.locator(`[data-preview="${s}"]`).click();await page.locator('.card').screenshot({path:path.join(assets,`state-${label}.png`)});}
  await page.setViewportSize({width:375,height:900});await page.locator('[data-preview="success"]').click();await page.screenshot({path:path.join(assets,'prototype-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1020});await page.locator('#scenario').selectOption('success');await page.locator('.stage').screenshot({path:path.join(assets,'gif-frame-0.png')});await page.locator('#primary').click();for(let i=1;i<4;i++){await page.locator('.stage').screenshot({path:path.join(assets,`gif-frame-${i}.png`)});await page.waitForTimeout(350);}await page.waitForFunction(()=>document.querySelector('.card').dataset.state==='success');for(let i=4;i<6;i++){await page.locator('.stage').screenshot({path:path.join(assets,`gif-frame-${i}.png`)});}
  await page.setViewportSize({width:1600,height:1000});await page.goto(base+'/case.html');await page.evaluate(()=>document.body.classList.add('export'));await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  for(const [id,label] of [['cover','01-capa'],['context','02-contexto'],['states','03-estados'],['behavior','04-comportamento'],['ending','05-fechamento']]){await page.locator('#'+id).screenshot({path:path.join(assets,label+'.png')});}
  assert.deepEqual(errors,[]);pass('Nenhum erro de JavaScript nos fluxos e exports');
  fs.writeFileSync(path.join(root,'docs','validation-results.json'),JSON.stringify({results,contrast:ratios},null,2)+'\n');
  console.log(JSON.stringify({results,contrast:ratios},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
