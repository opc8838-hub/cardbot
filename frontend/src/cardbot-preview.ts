import './cardbot-preview.css';
import { mountTextArt } from './text-art';
import { mountWorkbench } from './workbench';
import { toggleCardbotTheme } from './theme-transition';
import { runCardbotLanguageTransition } from './language-transition';
import { ENTRY_MOTION, durationWithinOneFrame } from './entry-motion';

const root = document.querySelector<HTMLDivElement>('#cardbot')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const appBase = import.meta.env.BASE_URL;
let locale = localStorage.getItem('cardbot_locale') === 'en' ? 'en' : 'zh';
let screen: 'hello' | 'film' | 'login' | 'manifesto' | 'workspace' = 'hello';
let dispose = () => {}, generation = 0;
const introAudio = document.createElement('audio');
introAudio.dataset.testid = 'intro-score';
introAudio.preload = 'auto';
introAudio.autoplay = true;
introAudio.className = 'intro-score-audio';
introAudio.setAttribute('src', `${appBase}assets/cardbot-intro-score.m4a`);
introAudio.setAttribute('aria-hidden', 'true');
introAudio.tabIndex = -1;
document.body.appendChild(introAudio);
let introAudioActive = false;
let introTimelineStartedAt = 0;
const t = (zh: string, en: string) => locale === 'zh' ? zh : en;
const button = (label: string, action: string, extra = '') => `<button class="pill ${extra}" data-action="${action}">${label}</button>`;
const language = () => button(locale === 'zh' ? 'EN' : '中文','language');
const theme = () => button(document.documentElement.dataset.theme === 'dark' ? t('◐ 浅色','◐ Light') : t('◐ 深色','◐ Dark'),'theme');
const audioIcon = () => introAudio.muted
  ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path class="audio-slash" d="m5 4 14 16"/></svg>'
  : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path class="audio-wave" d="M16 9.2a4 4 0 0 1 0 5.6M18.7 6.5a7.8 7.8 0 0 1 0 11"/></svg>';
const audioButton = () => {
  const label = introAudio.muted ? t('打开声音','Turn sound on') : t('关闭声音','Mute sound');
  return `<button class="intro-audio-button" type="button" data-action="intro-audio" data-testid="intro-audio-toggle" data-muted="${introAudio.muted}" aria-label="${label}" title="${label}">${audioIcon()}</button>`;
};
const loginScene = (extraClass = '') => `<section class="login-screen ${extraClass}"><div class="login-top"><a class="login-wordmark" href="${appBase}">cardbot<span>®</span></a><div class="login-top-actions">${audioButton()}<span>03 / SIGN IN</span></div></div><div class="login-perspective"><form class="login-card" data-login-form novalidate><div class="login-card-face login-card-back" aria-hidden="true"><span class="login-card-eyes"><i></i><i></i></span></div><div class="login-card-face login-card-front"><div class="login-content"><span class="login-kicker">CARDBOT WORKSPACE</span><h1>Welcome back.</h1><p>Continue to your company workspace.</p><label><span>Account</span><input name="account" autocomplete="username" aria-label="Account"></label><label><span>Password</span><input name="password" type="password" autocomplete="current-password" aria-label="Password"></label><button class="pill primary login-submit" type="submit">Log in <span>↗</span></button><footer><span>One workday. Every conversation.</span><b><i></i> READY</b></footer></div></div></form></div></section>`;

function refreshAudioButtons() {
  root.querySelectorAll<HTMLButtonElement>('[data-action="intro-audio"]').forEach(control=>{
    const label=introAudio.muted?t('打开声音','Turn sound on'):t('关闭声音','Mute sound');
    control.dataset.muted=String(introAudio.muted);
    control.setAttribute('aria-label',label);
    control.title=label;
    control.innerHTML=audioIcon();
  });
}

async function startIntroAudio(run: number) {
  introAudioActive=true;
  introAudio.pause();
  introAudio.currentTime=0;
  introAudio.muted=false;
  try { await introAudio.play(); }
  catch {
    if(run!==generation)return;
    introAudio.muted=true;
    try { await introAudio.play(); } catch { /* The icon remains available for a user gesture. */ }
  }
  if(run===generation)refreshAudioButtons();
}

function stopIntroAudio() {
  introAudioActive=false;
  introTimelineStartedAt=0;
  introAudio.pause();
  introAudio.currentTime=0;
  introAudio.muted=false;
}

function toggleIntroAudio() {
  if(!introAudioActive)return;
  if(introAudio.muted||introAudio.paused){
    introAudio.muted=false;
    if(introAudio.paused&&introTimelineStartedAt&&Number.isFinite(introAudio.duration)){
      const elapsed=(performance.now()-introTimelineStartedAt)/1000;
      introAudio.currentTime=Math.min(elapsed,Math.max(0,introAudio.duration-.05));
    }
    void introAudio.play().catch(()=>{introAudio.muted=true;refreshAudioButtons();});
  }else introAudio.muted=true;
  refreshAudioButtons();
}

function armLoginRestState(card: HTMLElement, onSettled = () => {}) {
  if(reduced.matches){card.classList.add('login-card-rest');onSettled();return;}
  const settle=(event: AnimationEvent)=>{
    if(event.target!==card||event.animationName!=='login-card-turn')return;
    card.classList.add('login-card-rest');
    card.removeEventListener('animationend',settle);
    onSettled();
  };
  card.addEventListener('animationend',settle);
}

document.documentElement.dataset.theme = localStorage.getItem('cardbot_theme') === 'dark' ? 'dark' : 'light';

function clean() { generation++; dispose(); dispose=()=>{}; }

function workspace() {
  clean();screen='workspace';
  dispose=mountWorkbench(root,()=>{locale=localStorage.getItem('cardbot_locale')==='en'?'en':'zh';void entrance();});
  window.scrollTo(0,0);
}

async function entrance() {
  clean();screen='hello';const run=generation;
  document.documentElement.lang=locale==='zh'?'zh-CN':'en';
  root.innerHTML=`<section class="hello-screen"><div class="intro-top"><span>CARDBOT / GLOBAL TRADE</span><div class="intro-actions">${audioButton()}${language()}${button(t('跳过动画 ↗','Skip intro ↗'),'skip')}</div></div><div class="greeting"><span class="hello-dot">•</span><span id="hello-word">Hello</span></div><footer>${t('同一个工作日，每一次对话。','One workday. Every conversation.')}<span>${t('01 — 欢迎','01 — WELCOME')}</span></footer></section>`;
  const word=root.querySelector<HTMLElement>('#hello-word')!;
  const wait=(ms:number)=>new Promise(resolve=>window.setTimeout(resolve,ms));
  if(reduced.matches){stopIntroAudio();word.textContent='Hello / 你好';await wait(900);if(run===generation)login();return;}
  await startIntroAudio(run);
  if(run!==generation)return;
  introTimelineStartedAt=performance.now();
  await wait(ENTRY_MOTION.helloInitialMs);
  for(const [text,lang] of [['你好','zh-CN'],['Hola','es'],['Bonjour','fr'],['مرحباً','ar'],['こんにちは','ja']]){
    if(run!==generation)return;word.classList.add('out');await wait(ENTRY_MOTION.helloTransitionMs);if(run!==generation)return;
    word.textContent=text;word.lang=lang;word.classList.remove('out');await wait(ENTRY_MOTION.helloHoldMs);
  }
  if(run===generation)film();
}

function film() {
  clean();screen='film';const run=generation;
  document.documentElement.lang='en';
  root.innerHTML=`<section class="intro-film-screen" aria-label="CardBot introduction"><video class="intro-film" autoplay muted playsinline preload="auto" src="${appBase}assets/cardbot-cards-intro.mp4"></video><div class="film-chrome"><span>CARDBOT / FIND YOUR CARD</span><div class="intro-actions">${audioButton()}${button('Skip ↗','skip')}</div></div><span class="film-count">02 — CARDBOT</span></section>`;
  const video=root.querySelector<HTMLVideoElement>('.intro-film')!;
  let advanced=false;
  const advance=()=>{
    if(advanced||run!==generation)return;
    advanced=true;screen='login';document.documentElement.lang='en';
    root.style.setProperty('--login-motion-duration',`${ENTRY_MOTION.loginDurationMs}ms`);
    const filmScreen=root.querySelector<HTMLElement>('.intro-film-screen')!;
    filmScreen.insertAdjacentHTML('beforeend',loginScene('login-screen-overlay'));
    armLoginRestState(filmScreen.querySelector<HTMLElement>('.login-card')!,stopIntroAudio);
    requestAnimationFrame(()=>requestAnimationFrame(()=>filmScreen.classList.add('handoff-to-login')));
    window.scrollTo(0,0);
  };
  const fallback=()=>{if(advanced||run!==generation)return;advanced=true;login();};
  video.addEventListener('ended',advance,{once:true});
  video.addEventListener('error',fallback,{once:true});
  video.addEventListener('loadedmetadata',()=>{video.dataset.timeline=durationWithinOneFrame(video.duration)?'verified':'duration-mismatch';},{once:true});
  void video.play().catch(()=>window.setTimeout(fallback,900));
  dispose=()=>{advanced=true;video.pause();video.removeEventListener('ended',advance);video.removeEventListener('error',fallback);};
}

function login() {
  stopIntroAudio();clean();screen='login';document.documentElement.lang='en';
  root.style.setProperty('--login-motion-duration',`${ENTRY_MOTION.loginDurationMs}ms`);
  root.innerHTML=loginScene();
  armLoginRestState(root.querySelector<HTMLElement>('.login-card')!);
  window.scrollTo(0,0);
}

function completeLogin() {
  stopIntroAudio();
  locale='en';
  localStorage.setItem('cardbot_locale','en');
  manifesto();
}

function manifesto() {
  clean();screen='manifesto';document.documentElement.lang=locale==='zh'?'zh-CN':'en';
  root.innerHTML=`<section class="manifesto"><header class="masthead"><a class="wordmark" href="${appBase}">cardbot<span>®</span></a><span class="section-label">${t('04 / 工作方式','04 / THE WAY WE WORK')}</span><div class="header-actions">${language()}${theme()}${button(t('工作台 ↗','Workspace ↗'),'workspace')}</div></header><div class="word-field"><canvas id="card-letters" aria-hidden="true"></canvas><h1 class="capabilities"><span>${t('事实依据','Evidence')}</span><span>${t('工作日','Workday')}</span><span>${t('审核','Review')}</span><span>${t('起草','Draft')}</span><span>${t('交付','Deliver')}</span></h1></div><footer class="manifesto-footer"><p>${t('从已发生的对话。','From what was said.')}<br>${t('到接下来要做的事。','To what happens next.')}</p><div><span class="mono">HISTORY → HUMAN REVIEW → DRAFT</span>${button(t('进入工作台 ↗','Enter workspace ↗'),'workspace','primary')}</div></footer></section>`;
  dispose=mountTextArt(root.querySelector<HTMLCanvasElement>('#card-letters')!,'card');
}

root.addEventListener('click',event=>{
  const action=(event.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
  if(!action||screen==='workspace')return;
  if(action==='workspace')workspace();
  if(action==='skip'&&(screen==='hello'||screen==='film'))login();
  if(action==='intro-audio')toggleIntroAudio();
  if(action==='language'){runCardbotLanguageTransition(()=>{locale=locale==='zh'?'en':'zh';localStorage.setItem('cardbot_locale',locale);if(screen==='hello')void entrance();else if(screen==='manifesto')manifesto();});}
  if(action==='theme'&&screen==='manifesto')toggleCardbotTheme((event.target as HTMLElement).closest('button')||undefined,next=>{
    const control=root.querySelector<HTMLElement>('[data-action="theme"]');
    if(control)control.textContent=next==='dark'?t('◐ 浅色','◐ Light'):t('◐ 深色','◐ Dark');
  });
});
root.addEventListener('submit',event=>{if((event.target as HTMLElement).matches('[data-login-form]')){event.preventDefault();completeLogin();}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&(screen==='hello'||screen==='film'))login();});
window.addEventListener('pagehide',()=>{stopIntroAudio();clean();});

const query=new URLSearchParams(location.search);
if(query.get('intro')==='1'||!sessionStorage.getItem('cardbot_intro_v3'))void entrance();else workspace();
