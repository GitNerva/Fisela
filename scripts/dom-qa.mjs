import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {default:parser}=await import(process.env.HTML_PARSER_PATH?pathToFileURL(process.env.HTML_PARSER_PATH).href:'node-html-parser');
const proto=parser.HTMLElement.prototype;
function def(name,get,set){Object.defineProperty(proto,name,{get,set,configurable:true});}
def('dataset',function(){const el=this;return new Proxy({}, {get(_,k){return el.getAttribute('data-'+String(k).replace(/[A-Z]/g,x=>'-'+x.toLowerCase()));},set(_,k,v){el.setAttribute('data-'+String(k).replace(/[A-Z]/g,x=>'-'+x.toLowerCase()),v);return true;}});});
def('hidden',function(){return this.hasAttribute('hidden');},function(v){v?this.setAttribute('hidden',''):this.removeAttribute('hidden');});
def('disabled',function(){return this.hasAttribute('disabled');},function(v){v?this.setAttribute('disabled',''):this.removeAttribute('disabled');});
def('checked',function(){return this.hasAttribute('checked');},function(v){v?this.setAttribute('checked',''):this.removeAttribute('checked');});
def('value',function(){return this._value??(this.tagName==='SELECT'?(this.querySelector('option[selected]')||this.querySelector('option'))?.getAttribute('value'):this.getAttribute('value'))??'';},function(v){this._value=String(v);});
def('style',function(){return this._style??=( {setProperty(k,v){this[k]=v;}});});
proto.focus=function(){};proto.scrollIntoView=function(){};proto.reportValidity=()=>true;
proto.addEventListener=function(k,v){this._listeners??={};this._listeners[k]=v;};
proto.getTotalLength=()=>500;proto.getPointAtLength=n=>({x:n,y:n});
const doc=parser.parse(await fs.readFile(path.join(root,'index.html'),'utf8'));
doc.documentElement=doc.querySelector('html');doc.body=doc.querySelector('body');doc.addEventListener=()=>{};
globalThis.document=doc;globalThis.window={scrollTo(){},addEventListener(type,fn){this[type]=fn;},print(){}};
globalThis.location={hash:'#/'};globalThis.matchMedia=()=>({matches:false,addEventListener(){}});
const memory=new Map;Object.defineProperty(globalThis,'localStorage',{value:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},configurable:true});
globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile(url,'utf8'))});
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.FormData=class {constructor(form){this.form=form;}get(name){const e=this.form.querySelectorAll('[name]').filter(e=>e.getAttribute('name')===name).find(e=>e.getAttribute('type')!=='radio'||e.checked);return e?.value??null;}};
await import(pathToFileURL(path.join(root,'assets/app.js')));
const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
async function nav(hash){location.hash=hash;await window.hashchange();}
assert.equal($$('a.chapter-card').length,11);assert.equal($$('.part-tab:disabled').length,3);
for(let i=1;i<=11;i++){await nav(`#/chapter/c${i}`);assert.ok($('h1'));assert.equal($$('.question').length,5);assert.ok($$('.animation-card').length>=1);assert.ok($('.original-text'));assert.equal($$('.lesson-section').length>=7,true);for(const replay of $$('[data-replay]'))replay.onclick();}
await nav('#/chapter/c1');$('#mark-done').onclick();assert.ok(memory.get('fasila-progress').includes('c1'));
const fav=$('[data-favorite]');fav.onclick();assert.equal(fav.getAttribute('aria-pressed'),'true');
const qs=JSON.parse(await fs.readFile(path.join(root,'data/quiz.json'),'utf8')).filter(q=>q.chapterId==='c1');
for(const q of qs){if(q.type==='matching')q.pairs.forEach((p,i)=>$(`[name="${q.id}-${i}"]`).value=p.ar);else if(q.type==='complete')$(`[name="${q.id}"]`).value=q.answer;else $(`[name="${q.id}"][value="${q.answer}"]`).checked=true;}
$('.quiz-form')._listeners.submit({preventDefault(){}});assert.equal($('.quiz-result').hidden,false);assert.ok($('.quiz-result').textContent.includes('100'));assert.equal($$('.answer-feedback.correct').length,5);
await nav('#/glossary');assert.equal($$('.terms-table tbody tr').length,107);$('#term-search').oninput({target:{value:'المادة الفعالة'}});assert.ok($$('.terms-table tbody tr').length>0);$('#term-search').oninput({target:{value:'paracetamol'}});assert.ok($$('.terms-table tbody tr').length>0);$('#term-search').oninput({target:{value:''}});$('[data-mode="flash"]').onclick();assert.equal($('.flashcard').getAttribute('aria-expanded'),'false');$('.flashcard').onclick();assert.equal($('.flashcard').getAttribute('aria-expanded'),'true');$('[data-flash="review"]').onclick();assert.ok(memory.get('fasila-progress').includes('review'));
await nav('#/chapter/c3');$('[data-case="0"]').onclick();$('[data-category="préventive"]').onclick();assert.ok($('.exercise-feedback').textContent.includes('1'));
await nav('#/chapter/c4');for(const i of [1,4,5])$(`[data-line="${i}"]`).onclick();assert.ok($('.exercise-feedback').textContent.includes('3 من 3'));
await nav('#/chapter/c6');$('[data-angle="90"]').onclick();assert.ok($('.injection-result').textContent.includes('Muscle'));$('.animation-stage select').value='iv';$('.animation-stage select').onchange();assert.ok($('.route-description').textContent.includes('الوريدي'));
await nav('#/chapter/c7');$('[data-form-filter="skin"]').onclick();assert.equal($$('[data-form]').length,2);$('[data-form-play]').onclick();
await nav('#/chapter/c8');$('.timeline-markers+input').value='20';$('.timeline-markers+input').oninput();assert.ok($('.timeline-result').textContent.includes('20'));
await nav('#/chapter/c11');$('[data-branch="0"]').onclick();$('[data-option="1"]').onclick();assert.ok($('.decision-result').textContent.includes('Magistral'));
await nav('#/exam');$('#start-exam').onclick();assert.equal($$('.question').length,11);assert.equal($('#exam-setup').hidden,true);$('#cancel-exam').onclick();assert.ok($('#start-exam'));
await nav('#/summary');assert.equal($$('.a4-page').length,11);await nav('#/summary/c7');assert.equal($$('.a4-page').length,1);
await nav('#/');assert.ok($('.progress-label').textContent.includes('1 من 11'));$('#theme-toggle').onclick();assert.equal(doc.documentElement.dataset.theme,'dark');
await nav('#/chapter/missing');assert.ok($('h1').textContent.includes('تعذّر'));
console.log('PASS — DOM flow smoke checks: all routes, 11 chapter quizzes, replay buttons, grading, progress, favorites, bilingual search, flashcards, exercises, exam setup, summaries, theme, invalid route. This is a DOM adapter, not browser/layout QA.');
