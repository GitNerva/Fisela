import {$,$$,rich,escape,normalize,state,save,icons,french} from './core.js';
const display = value => /[A-Za-zÀ-ÿ]/.test(value) && !/[\u0600-\u06ff]/.test(value) ? french(value) : rich(value);
export function isCorrect(question, answer) {
 if(question.type==='matching') return Array.isArray(answer) && question.pairs.every((pair,i)=>answer[i]===pair.ar);
 if(question.type==='complete') return normalize(answer ?? '')===normalize(question.answer);
 return answer!==null && answer!==undefined && answer!=='' && Number(answer)===question.answer;
}
export function mountQuiz(root,questions,{exam=false,chapterNames={},onFinish=()=>{},onRetry=null}={}){
 let submitted=false;
 root.innerHTML=`<form class="quiz-form"><div class="quiz-intro"><span class="tag">${exam?'تحدّي المراجعة':'اختبار الفصل'}</span><span>${questions.length} أسئلة · خذ وقتك في التفكير</span></div>${questions.map((q,i)=>`<fieldset class="question" id="question-${escape(q.id)}"><legend><span class="question-number">${i+1}</span>${rich(q.prompt)}</legend>${q.extra?'<span class="extra-label">إضافة للتوضيح</span>':''}${q.type==='matching'?q.pairs.map((p,j)=>`<label class="match-row"><bdi lang="fr" dir="ltr">${escape(p.fr)}</bdi><select name="${q.id}-${j}" required aria-label="معنى ${escape(p.fr)}"><option value="">اختر المعنى</option>${[...q.pairs].reverse().map(x=>`<option value="${escape(x.ar)}">${escape(x.ar)}</option>`).join('')}</select></label>`).join(''):q.type==='complete'?`<label class="input-label" for="answer-${q.id}">اكتب المصطلح بالفرنسية</label><input class="term-input" id="answer-${q.id}" name="${q.id}" dir="ltr" lang="fr" autocomplete="off" spellcheck="false" required>`:q.options.map((o,j)=>`<label class="answer-option"><input type="radio" name="${q.id}" value="${j}" required><span>${display(o)}</span></label>`).join('')}<div class="answer-feedback" hidden></div></fieldset>`).join('')}<div class="quiz-submit-row"><button class="button primary" type="submit">${exam?'إنهاء الاختبار وعرض النتيجة':'صحّح إجاباتي'} ${icons.check}</button><span class="muted">كل سؤال فرصة للفهم، لا للحفظ فقط.</span></div></form><div class="quiz-result" tabindex="-1" hidden></div>`;
 function submit(force=false){
  if(submitted)return;
  const form=$('form',root);
  if(!force&&!form.reportValidity())return;
  submitted=true;
  const data=new FormData(form);let correct=0;const byChapter={};
  questions.forEach(q=>{
   const ok=isCorrect(q,q.type==='matching'?q.pairs.map((_,j)=>data.get(`${q.id}-${j}`)):data.get(q.id));
   if(ok)correct++;
   byChapter[q.chapterId]??={correct:0,total:0};byChapter[q.chapterId].total++;if(ok)byChapter[q.chapterId].correct++;
   const feedback=$(`#question-${q.id} .answer-feedback`,root);feedback.hidden=false;feedback.classList.add(ok?'correct':'incorrect');
   const answer=q.type==='matching'?q.pairs.map(p=>`{{${p.fr}}}: ${p.ar}`).join('؛ '):q.type==='complete'?q.answer:q.options[q.answer];
   feedback.innerHTML=`<strong>${ok?'أحسنت، إجابة صحيحة.':'نراجعها معًا.'}</strong>${!ok?`<p>الإجابة الصحيحة: ${display(answer)}</p>`:''}<p>${rich(q.explanation)}</p>`;
  });
  const percent=Math.round(correct/questions.length*100);
  Object.entries(byChapter).forEach(([id,score])=>{state.scores[id]={...score,percent:Math.round(score.correct/score.total*100),date:Date.now(),mode:exam?'exam':'chapter'};});save();
  $$('input,select,button[type="submit"]',form).forEach(x=>x.disabled=true);
  const weak=Object.entries(byChapter).filter(([,s])=>s.correct/s.total<.7);
  const result=$('.quiz-result',root);result.hidden=false;
  result.innerHTML=`<div class="score-ring" style="--score:${percent}%"><span>${percent}<small>%</small></span></div><div><span class="eyebrow">خطوة أخرى نحو الفهم</span><h3>${percent>=80?'مراجعة موفّقة!':percent>=50?'بداية جيدة، نثبّت ما بقي.':'كل شيء يبدأ بالمحاولة.'}</h3><p>أجبت بشكل صحيح عن ${correct} من ${questions.length} أسئلة.</p>${weak.length?`<p>فصول تحتاج مراجعة:</p><div class="weak-links">${weak.map(([id])=>`<a href="#/chapter/${id}">${escape(chapterNames[id]||id)} ${icons.arrow}</a>`).join('')}</div>`:'<p>لا توجد فصول ضعيفة في هذه المحاولة. واصل المراجعة المتباعدة.</p>'}<button class="button secondary" type="button" data-retry>حاول مرة أخرى ${icons.replay}</button></div>`;
  $('[data-retry]',result).onclick=()=>onRetry?onRetry():mountQuiz(root,questions,{exam,chapterNames,onFinish,onRetry});
  result.focus();result.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  onFinish({correct,total:questions.length,percent,byChapter});
 }
 $('form',root).addEventListener('submit',e=>{e.preventDefault();submit();});
 return {finish:()=>submit(true)};
}
