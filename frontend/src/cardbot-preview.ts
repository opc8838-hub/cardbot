import './cardbot-preview.css';
import { mountTextArt } from './text-art';
import { mountWorkbench } from './workbench';
const root = document.querySelector<HTMLDivElement>('#cardbot')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let locale = localStorage.getItem('cardbot_locale') === 'en' ? 'en' : 'zh';
let screen: 'hello' | 'manifesto' | 'workspace' = 'hello';
let dispose = () => {}, generation = 0;
const t = (zh: string, en: string) => locale === 'zh' ? zh : en;
const button = (label: string, action: string, extra = '') => `<button class="pill ${extra}" data-action="${action}">${label}</button>`;
const language = () => button(locale === 'zh' ? 'EN' : '中文','language');
const theme = () => button(document.documentElement.dataset.theme === 'dark' ? t('◐ 浅色','◐ Light') : t('◐ 深色','◐ Dark'),'theme');
document.documentElement.dataset.theme = localStorage.getItem('cardbot_theme') === 'dark' ? 'dark' : 'light';
function clean() { generation++; dispose(); dispose=()=>{}; }
function workspace() {
  clean(); screen='workspace';
  dispose=mountWorkbench(root,()=>{locale=localStorage.getItem('cardbot_locale')==='en'?'en':'zh';void entrance();});
  window.scrollTo(0,0);
}
async function entrance() {
  clean(); screen='hello'; const run=generation;
  document.documentElement.lang=locale==='zh'?'zh-CN':'en';
  root.innerHTML=`<section class="hello-screen"><div class="intro-top"><span>CARDBOT / GLOBAL TRADE</span><div class="intro-actions">${language()}${button(t('跳过动画 ↗','Skip intro ↗'),'skip')}</div></div><div class="greeting"><span class="hello-dot">•</span><span id="hello-word">Hello</span></div><footer>${t('同一个工作日，每一次对话。','One workday. Every conversation.')}<span>${t('01 — 欢迎','01 — WELCOME')}</span></footer></section>`;
  const word=root.querySelector<HTMLElement>('#hello-word')!;
  if(reduced.matches){word.textContent='Hello / 你好';return;}
  const wait=(ms:number)=>new Promise(resolve=>window.setTimeout(resolve,ms));
  await wait(1000);
  for(const [text,lang] of [['你好','zh-CN'],['Hola','es'],['Bonjour','fr'],['مرحباً','ar'],['こんにちは','ja']]){
    if(run!==generation)return;word.classList.add('out');await wait(280);if(run!==generation)return;
    word.textContent=text;word.lang=lang;word.classList.remove('out');await wait(850);
  }
  if(run===generation)manifesto();
}
function manifesto() {
  clean();screen='manifesto';document.documentElement.lang=locale==='zh'?'zh-CN':'en';
  root.innerHTML=`<section class="manifesto"><header class="masthead"><a class="wordmark" href="/">cardbot<span>®</span></a><span class="section-label">${t('02 / 工作方式','02 / THE WAY WE WORK')}</span><div class="header-actions">${language()}${theme()}${button(t('工作台 ↗','Workspace ↗'),'workspace')}</div></header><div class="word-field"><canvas id="card-letters" aria-hidden="true"></canvas><h1 class="capabilities"><span>${t('事实依据','Evidence')}</span><span>${t('工作日','Workday')}</span><span>${t('审核','Review')}</span><span>${t('起草','Draft')}</span><span>${t('交付','Deliver')}</span></h1></div><footer class="manifesto-footer"><p>${t('从已发生的对话。','From what was said.')}<br>${t('到接下来要做的事。','To what happens next.')}</p><div><span class="mono">HISTORY → HUMAN REVIEW → DRAFT</span>${button(t('进入工作台 ↗','Enter workspace ↗'),'workspace','primary')}</div></footer></section>`;
  dispose=mountTextArt(root.querySelector<HTMLCanvasElement>('#card-letters')!,'card');
}
root.addEventListener('click',event=>{
  const action=(event.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
  if(!action||screen==='workspace')return;
  if(action==='workspace')workspace();
  if(action==='skip')manifesto();
  if(action==='language'){locale=locale==='zh'?'en':'zh';localStorage.setItem('cardbot_locale',locale);if(screen==='hello')void entrance();else manifesto();}
  if(action==='theme'){document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('cardbot_theme',document.documentElement.dataset.theme);manifesto();}
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&screen==='hello')manifesto();});
window.addEventListener('pagehide',clean);
const query=new URLSearchParams(location.search);
if(query.get('intro')==='1'||!sessionStorage.getItem('cardbot_intro_v2'))void entrance();else workspace();
