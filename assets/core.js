export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const french = value => `<bdi lang="fr" dir="ltr">${escape(value)}</bdi>`;
export const rich = text => escape(text).replace(/\{\{(.*?)\}\}/g, (_, word) => `<bdi lang="fr" dir="ltr">${word}</bdi>`);
export const normalize = s => String(s).normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').toLowerCase().trim().replace(/[’'\s/-]+/g,' ');
const defaults = () => ({version:1,done:[],scores:{},favorites:[],flash:{},lastChapter:null});
function read(){if(typeof window==='undefined')return defaults();try {const v=JSON.parse(localStorage.getItem('fasila-progress'));if(v?.version===1)return {version:1,done:Array.isArray(v.done)?v.done.filter(x=>typeof x==='string'):[],scores:v.scores&&typeof v.scores==='object'?v.scores:{},favorites:Array.isArray(v.favorites)?v.favorites:[],flash:v.flash&&typeof v.flash==='object'?v.flash:{},lastChapter:typeof v.lastChapter==='string'?v.lastChapter:null};}catch{}return defaults();}
export const state = read();
let memoryNotice=false;
export function save(){try{localStorage.setItem('fasila-progress',JSON.stringify(state));}catch{if(!memoryNotice){toast('تعذّر الحفظ في هذا المتصفح؛ سيبقى تقدمك متاحًا خلال هذه الجلسة.');memoryNotice=true;}}}
let toastTimer;
export function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3500);}
export async function getJSON(file){const r=await fetch(new URL(`../data/${file}`,import.meta.url));if(!r.ok)throw new Error(`تعذّر تحميل ${file}`);return r.json();}
export const icons = {
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>',
 book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 6v15M12 6C8 3 4 4 2 5v14c4-2 7-1 10 2 3-3 6-4 10-2V5c-2-1-6-2-10 1Z"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
 lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg>',
 replay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/></svg>',
 print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M7 8V3h10v5M7 17H3V8h18v9h-4"/><path d="M7 14h10v7H7zM17 11h1"/></svg>'
};
