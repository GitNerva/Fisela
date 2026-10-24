import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {isCorrect} from '../assets/quiz.js';
import {normalize,rich} from '../assets/core.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,'data',file),'utf8'));
const [catalog,terms,questions]=await Promise.all(['chapters.json','glossary.json','quiz.json'].map(read));
const ids=new Set(catalog.chapters.map(c=>c.id));
assert.equal(ids.size,catalog.chapters.length,'Chapter IDs must be unique');
assert.ok(catalog.chapters.length>=11);assert.ok(terms.length>=60);assert.equal(catalog.objectives.length,5);
assert.equal(catalog.parts.length,4);assert.equal(catalog.parts.filter(p=>p.unlocked).length,1);
assert.equal(new Set(questions.map(q=>q.id)).size,questions.length,'Question IDs must be unique');
const requiredTerms=['pharmacologie','médicament','principe actif','excipient','DCI','nom de spécialité','princeps','générique','bioéquivalence','forme galénique',"voie d’administration",'voie entérale','voie parentérale','per os','voie sublinguale/buccale','voie rectale','voie transdermique','intradermique','sous-cutanée','intramusculaire','intraveineuse','ordonnance','posologie','pharmacocinétique','pharmacodynamie','pharmacovigilance','pharmacologie clinique','préclinique','DMT','tératogène','mutagène','cancérigène','AMM','brevet','phase I','phase II','phase III','phase IV','interaction médicamenteuse','synergie','potentialisation','antagonisme','automédication','xénobiotique','substitutive','symptomatique','étiologique','comprimé','gélule','sirop','suspension','émulsion','collyre','suppositoire','patch','LP','stupéfiant','liste I','liste II'];
for(const word of requiredTerms)assert.ok(terms.some(t=>normalize(t.fr)===normalize(word)),`Missing required term: ${word}`);
for(const term of terms){assert.ok(ids.has(term.chapterId));for(const key of ['fr','ar','simpleExplanationAr'])assert.ok(typeof term[key]==='string'&&term[key].length,`Term ${term.fr}: ${key}`);}
const requiredContent={
 c1:['Pharmaco','logie','Discipline carrefour','Pharmacothérapie','Thérapeutique','Radiothérapie','Thermalisme','Psychanalyse','Psychothérapie'],
 c2:['Pharmacocinétique','Absorption','Distribution','Métabolisme','Excrétion','Pharmacodynamie','Pharmacovigilance','Pharmacologie fondamentale','Pharmacologie clinique','Pharmacologie spéciale','Spectre d’action','Structure chimique'],
 c3:['Médicament','Principe actif','Excipient','Préventive','Substitutive','Symptomatique','Diagnostique','Urographie','Angiographie','IUPAC','OMS','Paracétamol','Doliprane','Parantal','acétaminophène'],
 c4:['Ordonnance','Dosage','Posologie','Durée du traitement','رقم هاتفه','القانونية'],
 c5:['Quinine','Morphine','Digitaline','Insuline','Héparine','Synthèse totale','Phénobarbital','Sulfamides','Hémisynthèse','Penicillium','Cellule hôte','EPO','GH'],
 c6:['Voie entérale','Voie parentérale','Per os','Voie rectale','Intradermique','Sous-cutanée','Intramusculaire','Intraveineuse','Intravasculaire','Intracardiaque','Intra-artérielle','Épidurale','90','45','25','10','15','Veine porte','Foie','Système cave','Poumon','Aorte','Biodisponibilité','Observance'],
 c7:['Galénique','Comprimés','Sécables','Pelliculés','Dragéifiés','Effervescents','Dispersibles','Orodispersibles','LP','Gastrorésistants','Gélules','Capsules molles','Granulés','Poudres','Sirops','Solutions buvables','Suspension','Émulsion','Stérilité','Apyrogénicité','Neutralité','Isotonicité','Limpidité','ORL','Oculaires','Pulmonaires','Rectales','Vaginales','Patchs'],
 c8:['10 000','Recherche exploratoire','In vitro','In silico','Évaluation préclinique','DMT','Cancérigène','Mutagène','Tératogène','Phase I','Phase II','Phase III','Phase IV','150','350','AMM','Qualité','Sécurité','Efficacité','Pharmacovigilance','CCP','20','10'],
 c9:['Brevet','20','Générique','17-04','2006','Bioéquivalence','Biodisponibilité','Princeps'],
 c10:['Interaction médicamenteuse','Intensité','Durée','Délai d’apparition','3','Automédication','Xénobiotique','Synergie additive','Potentialisation','Antagonisme'],
 c11:['Officinaux','Magistraux','Codex','Homéopathie','Allopathie','Médicaments non listés','conseils','grand public','Liste I','Liste II','Stupéfiants','12 mois','7 à 28 jours','hospitalier','Surveillance particulière','Compétence particulière']
};
let chapterCount=0;
for(const meta of catalog.chapters){const c=await read(meta.file);assert.equal(c.id,meta.id);assert.equal(c.partId,meta.partId);assert.ok(catalog.parts.some(p=>p.id===c.partId));
 for(const k of ['titleAr','titleFr','intro'])assert.ok(c[k]?.length,`${c.id}.${k}`);
 assert.ok(c.sections.length>=2);assert.ok(c.animations.length>=1);assert.ok(c.summary.length>=2);assert.ok(c.sourcePages.length);assert.equal(c.originals.length,c.sourcePages.length);
 assert.ok(c.sections.every(s=>Array.isArray(s.paragraphs)&&s.title));assert.ok(c.animations.every(a=>a.type&&a.title&&a.caption));
 const strings=value=>typeof value==='string'?[value]:Array.isArray(value)?value.flatMap(strings):value&&typeof value==='object'?Object.values(value).flatMap(strings):[];
 const copy=strings([c.intro,c.sections,c.summary]).join('\n');
 assert.equal((copy.match(/\{\{/g)||[]).length,(copy.match(/\}\}/g)||[]).length,`${c.id}: unbalanced French markers`);
 assert.ok(!/lorem ipsum|TODO|PLACEHOLDER/i.test(copy));
 for(const word of requiredContent[c.id]||[])assert.ok(normalize(copy).includes(normalize(word)),`${c.id}: missing teaching content ${word}`);
 const qs=questions.filter(q=>q.chapterId===c.id);assert.equal(qs.length,5,`${c.id}: five questions required`);
 assert.ok(terms.some(t=>t.chapterId===c.id));
 for(const q of qs){assert.ok(q.prompt&&q.explanation);assert.ok(['mcq','boolean','matching','complete'].includes(q.type));
  if(q.type==='matching'){assert.ok(q.pairs.length>=2);assert.ok(isCorrect(q,q.pairs.map(p=>p.ar)));assert.ok(!isCorrect(q,q.pairs.map(()=>'')));}
  else if(q.type==='complete'){assert.ok(isCorrect(q,q.answer.toUpperCase()));assert.ok(!isCorrect(q,'مجهول'));assert.ok(!isCorrect(q,''));}
  else {assert.ok(q.options.length>=2);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);assert.ok(isCorrect(q,String(q.answer)));assert.ok(!isCorrect(q,String((q.answer+1)%q.options.length)));assert.ok(!isCorrect(q,null));}
 }
 chapterCount++;
}
assert.ok(isCorrect({type:'complete',answer:'Émulsion'},' emulsion '),'Accent-insensitive French answers');
assert.equal(rich('{{DCI}} <script>'),'<bdi lang="fr" dir="ltr">DCI</bdi> &lt;script&gt;','Content escaping and bidi isolation');
assert.ok(questions.filter(q=>q.extra).length>=2,'Illustrative questions must be labelled');
for(const type of ['mcq','boolean','matching','complete'])assert.ok(questions.some(q=>q.type===type));
for(const n of [6,36,40,68,81])assert.ok((await fs.stat(path.join(root,`assets/source-${n}.webp`))).size>1000);
assert.ok((await fs.stat(path.join(root,catalog.course.source))).size>1000);
const html=await fs.readFile(path.join(root,'index.html'),'utf8');assert.match(html,/<html lang="ar" dir="rtl">/);assert.match(html,/هذا الموقع للمراجعة فقط، والمرجع هو درس الأستاذة ودروس المعهد/);
const postcssPath=process.env.POSTCSS_PATH;
if(postcssPath){const {default:postcss}=await import(postcssPath);postcss.parse(await fs.readFile(path.join(root,'assets/styles.css'),'utf8'));}
console.log(`PASS — ${chapterCount} chapters, ${terms.length} terms, ${questions.length} questions; source assets, required coverage, all answer types, empty/wrong answers and escaped French isolation verified.`);
