/** Optional real-browser QA. Start any static server first; no runtime dependencies. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const deps=process.env.QA_NODE_MODULES||path.join(root,'node_modules');
const require=createRequire(path.join(deps,'__qa.cjs'));
const {chromium}=require('playwright-core');
const axePath=require.resolve('axe-core/axe.min.js');
const chrome=process.env.CHROME_PATH;if(!chrome)throw new Error('Set CHROME_PATH to the Chrome/Chromium executable.');
const base=(process.env.BASE_URL||'http://127.0.0.1:8000/').replace(/\/?$/,'/');
const out=path.join(root,'test-results');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:chrome,headless:true,args:process.env.QA_NO_SANDBOX==='1'?['--no-sandbox']:[]});
const allQuestions=JSON.parse(await fs.readFile(path.join(root,'data/quiz.json'),'utf8'));
const report={base,checks:[],accessibility:[],errors:[]};
async function visit(page,route=''){await page.goto(`${base}#/${route}`);await page.locator('h1').waitFor();await page.waitForFunction(()=>!document.querySelector('.loading'));}
async function fillAnswers(page,qs){for(const q of qs){if(q.type==='matching'){for(const [i,p] of q.pairs.entries())await page.locator(`[name="${q.id}-${i}"]`).selectOption(p.ar);}else if(q.type==='complete')await page.locator(`[name="${q.id}"]`).fill(q.answer);else await page.locator(`[name="${q.id}"][value="${q.answer}"]`).check();}}
async function audit(page,label){await page.addScriptTag({path:axePath});const result=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>n.target)})),passes:r.passes.length};});report.accessibility.push({label,...result});}
async function noOverflow(page,label){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`Viewport overflow: ${label}`);}
try{
 for(const width of [360,1440]){
  const context=await browser.newContext({viewport:{width,height:width===360?800:1000},colorScheme:'light'});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await visit(page);assert.equal(await page.locator('.chapter-card').count(),11);await noOverflow(page,`home ${width}`);await page.screenshot({path:path.join(out,`home-${width}.png`),fullPage:true});await audit(page,`home ${width}`);
  for(let i=1;i<=11;i++){await visit(page,`chapter/c${i}`);assert.equal(await page.locator('.question').count(),5);await noOverflow(page,`c${i} ${width}`);await audit(page,`chapter ${i}, ${width}`);}
  await visit(page,'chapter/c1');await fillAnswers(page,allQuestions.filter(q=>q.chapterId==='c1'));await page.getByRole('button',{name:'صحّح إجاباتي'}).click();await page.locator('.quiz-result').waitFor({state:'visible'});assert.equal(await page.locator('.answer-feedback.correct').count(),5);
  await page.locator('#mark-done').click();await page.locator('[data-favorite]').first().click();await page.reload();await page.locator('#mark-done').waitFor();assert.equal(await page.locator('#mark-done').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-favorite]').first().getAttribute('aria-pressed'),'true');
  await visit(page,'glossary');await page.locator('#term-search').fill('المادة الفعالة');assert.ok(await page.locator('.terms-table tbody tr').count()>0);await page.locator('#term-search').fill('paracetamol');assert.ok(await page.locator('.terms-table tbody tr').count()>0);await page.locator('#term-search').fill('');await page.locator('[data-mode="flash"]').click();await page.locator('.flashcard').click();assert.equal(await page.locator('.flashcard').getAttribute('aria-expanded'),'true');await page.locator('[data-flash="review"]').click();await audit(page,`flashcards ${width}`);
  await visit(page,'chapter/c3');await page.locator('[data-case="0"]').click();await page.locator('[data-category="préventive"]').click();assert.ok((await page.locator('.exercise-feedback').textContent()).includes('1 من'));
  await visit(page,'chapter/c4');for(const line of [1,4,5])await page.locator(`[data-line="${line}"]`).click();assert.ok((await page.locator('.exercise-feedback').textContent()).includes('3 من 3'));
  await visit(page,'chapter/c6');await page.locator('[data-angle="90"]').click();assert.ok((await page.locator('.injection-result').textContent()).includes('Muscle'));await page.locator('.animation-stage select').selectOption('iv');await page.locator('[data-play-route]').click();await page.screenshot({path:path.join(out,`routes-${width}.png`),fullPage:true});
  await visit(page,'chapter/c7');await page.locator('[data-form-filter="skin"]').click();assert.equal(await page.locator('[data-form]').count(),2);await page.locator('[data-form-play]').click();
  await visit(page,'chapter/c8');await page.locator('.timeline-markers+input').fill('20');assert.ok((await page.locator('.timeline-result').textContent()).includes('20'));
  await visit(page,'chapter/c11');await page.locator('[data-branch="0"]').click();await page.locator('[data-option="1"]').click();assert.ok((await page.locator('.decision-result').textContent()).includes('Magistral'));
  await visit(page,'exam');await page.locator('#start-exam').click();assert.equal(await page.locator('.question').count(),11);await audit(page,`exam ${width}`);const qids=await page.locator('.question').evaluateAll(els=>els.map(e=>e.id.replace('question-','')));await fillAnswers(page,allQuestions.filter(q=>qids.includes(q.id)));await page.getByRole('button',{name:'إنهاء الاختبار وعرض النتيجة'}).click();assert.equal(await page.locator('.answer-feedback.correct').count(),11);await page.locator('[data-retry]').click();await page.locator('#start-exam').waitFor();
  await visit(page,'summary');assert.equal(await page.locator('.a4-page').count(),11);await noOverflow(page,`summary ${width}`);await audit(page,`summaries ${width}`);
  if(width===1440){await page.emulateMedia({media:'print'});const pdf=await page.pdf({path:path.join(out,'summaries-a4.pdf'),preferCSSPageSize:true,printBackground:true});const pages=(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length;assert.equal(pages,11,'One A4 page per chapter');await page.emulateMedia({media:'screen'});}
  await visit(page);await page.locator('#theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.screenshot({path:path.join(out,`home-dark-${width}.png`),fullPage:true});await audit(page,`dark ${width}`);
  await page.emulateMedia({reducedMotion:'reduce'});await visit(page,'chapter/c6');await page.locator('[data-replay]').first().click();await page.locator('[data-play-route]').click();await noOverflow(page,`reduced motion ${width}`);
  // Confirm the quiz timer finishes rather than allowing negative time.
  await page.clock.install();await visit(page,'exam');await page.locator('#exam-timed').check();await page.locator('#start-exam').click();await page.clock.fastForward(11*60*1000+1500);await page.locator('.quiz-result').waitFor({state:'visible'});assert.ok((await page.locator('#exam-timer').textContent()).includes('اكتمل'));await page.clock.uninstall();
  report.checks.push(`PASS ${width}px: routes, no viewport overflow, grading, persisted completion/favorites, bilingual search, flashcards, interactions, exam/timer, summary, dark/reduced motion`);await context.close();
 }
 // Storage errors must not prevent learning.
 const context=await browser.newContext();await context.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked');};Storage.prototype.setItem=()=>{throw new Error('blocked');};});const p=await context.newPage();await visit(p,'chapter/c1');await p.locator('#mark-done').click();assert.equal(await p.locator('#mark-done').getAttribute('aria-pressed'),'true');await context.close();report.checks.push('PASS blocked localStorage fallback');
 assert.deepEqual(report.errors,[],'No runtime errors');
 await fs.writeFile(path.join(out,'qa.json'),JSON.stringify(report,null,2));
 assert.equal(report.accessibility.flatMap(a=>a.violations).length,0,'Review axe violations in test-results/qa.json');
 console.log('PASS — browser checks and WCAG axe audits. Run Lighthouse separately for its accessibility score.');
}catch(error){report.failure=error.message;await fs.writeFile(path.join(out,'qa.json'),JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
