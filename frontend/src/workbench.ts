import './workbench.css';
import { mountTextArt } from './text-art';
import { getShanghaiGreeting as shanghaiGreeting } from './shanghai-greeting';
import { loadPreview, createDraft, editDraft, approveDraft, saveDraft, completeTask, STORAGE_KEY } from './preview-store';
import { scenes, rehearsalSnapshot, mailHistory, simulatedReceipt, type SimulatedReceipt } from './rehearsal';
import { createBotAssistant } from './bot-assistant';
import { REMOTE_PRESENTATION_PAGE_COUNT, remoteDeviceIcon, renderRemotePanel, type RemoteState } from './mobile-remote';
import { toggleCardbotTheme } from './theme-transition';
import { runCardbotLanguageTransition } from './language-transition';
import { loadProspectDemo, outreachBody, prospects, PROSPECT_STORAGE_KEY, type ProspectStage } from './prospecting-demo';
import { createIdleScreensaver } from './idle-screensaver';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const getShanghaiGreeting = (locale: 'zh' | 'en', date = new Date()) => shanghaiGreeting(locale, date);
const users = [
  { id: 'sales-01', name: 'Jojo', zh: '业务员 · 欧洲组', en: 'Sales · Europe' },
  { id: 'manager', name: 'Chen', zh: '经理 · 全球销售', en: 'Manager · Global sales' },
  { id: 'sales-02', name: 'Mina', zh: '业务员 · 协作组', en: 'Sales · Operations' },
  { id: 'sales-03', name: 'Leo', zh: '业务员 · 英国组', en: 'Sales · UK' }
];
const cities = [
  ['America/Los_Angeles','洛杉矶','Los Angeles'], ['America/New_York','纽约','New York'],
  ['Europe/London','伦敦','London'], ['Asia/Dubai','迪拜','Dubai'],
  ['Asia/Shanghai','上海','Shanghai'], ['Australia/Sydney','悉尼','Sydney'],
  ['Pacific/Honolulu','檀香山','Honolulu'], ['America/Sao_Paulo','圣保罗','São Paulo'],
  ['Europe/Paris','巴黎','Paris'], ['Asia/Tokyo','东京','Tokyo'], ['Pacific/Auckland','奥克兰','Auckland']
];
type View = 'overview' | 'prospecting' | 'workday' | 'evidence' | 'drafts' | 'outbox' | 'team' | 'organization';
type RenderMotion = 'none' | 'view';
type RemoteMotion = 'open' | 'next' | 'previous' | 'jump' | 'update' | 'instant';
export function mountWorkbench(root: HTMLElement, onIntro: () => void) {
  const botAssistant = createBotAssistant(root);
  const manual = loadPreview(localStorage);
  const prospectDemo = loadProspectDemo(localStorage);
  let locale: 'zh' | 'en' = localStorage.getItem('cardbot_locale') === 'en' ? 'en' : 'zh';
  let userId = users.some(u => u.id === localStorage.getItem('cardbot_demo_user')) ? localStorage.getItem('cardbot_demo_user')! : 'sales-01';
  let view: View = 'overview', selected = 'TASK-001', step = -1, playing = false, timer = 0, clock = 0;
  let releaseArt = () => {}, menuOpen = false, filter = 'all', notice = '', focusMail = 'EMAIL-001';
  let receipt: SimulatedReceipt | null = null, draftMode: 'reply' | 'outreach' = 'reply';
  let remoteOpen = false, remoteState: RemoteState = 'waiting', remoteSeed = 1, remotePage = 0;
  const receiptKey = 'cardbot_simulated_receipt_v1';
  try { const value = JSON.parse(localStorage.getItem(receiptKey) || 'null'); if (value?.kind === 'simulation' && value.body === manual.draft.body && manual.draft.status === 'saved_local') receipt = value; } catch { /* Optional receipt. */ }
  const t = (zh: string, en: string) => locale === 'zh' ? zh : en;
  const state = () => step >= 0 ? rehearsalSnapshot(step) : manual;
  const actor = () => step >= 0 ? (step === scenes.length - 1 ? 'manager' : 'sales-01') : userId;
  const isManager = () => actor() === 'manager';
  const ownsWork = () => actor() === 'sales-01' || isManager();
  const tasks = () => ownsWork() ? state().tasks : [];
  const btn = (label: string, action: string, primary = false, disabled = false) => `<button class="wb-button ${primary ? 'primary' : ''}" data-wb-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  const status = (s: string) => s === 'done' ? t('已完成','Completed') : s === 'open' ? t('进行中','In progress') : t('待确认','Needs confirmation');
  const title = (id: string) => ({'TASK-001':t('准备新版报价回复','Prepare revised quotation reply'),'TASK-002':t('提交客户跟进汇总','Submit customer follow-up summary'),'TASK-003':t('确认样品寄送地址','Confirm sample shipping address')}[id] || id);
  const missing = (id: string) => ({'TASK-001':t('新版价格、供应商确认交期','Revised price and supplier-confirmed delivery'),'TASK-002':t('汇总提交记录','Report submission record'),'TASK-003':t('完整地址与确认记录','Full address and customer confirmation')}[id] || '');
  const navs: [View,string,string,string][] = [['overview','◈','工作总览','Overview'],['prospecting','⌁','客户开发','Customer development'],['workday','☷','今日工作','My workday'],['evidence','✉','客户与邮件','Customers & mail'],['drafts','▤','草稿与审核','Drafts & review'],['outbox','↗','小满草稿箱','OKKI draft box'],['team','◷','团队进度','Team progress'],['organization','⚙','企业设置','Organization']];
  const nameOf = (v: View) => { const n = navs.find(n => n[0] === v)!; return t(n[2],n[3]); };
  const remoteTrigger = () => `<button class="wb-remote-trigger" data-wb-action="remote" data-testid="remote-trigger" aria-label="${t('手机远程设置','Mobile remote settings')}" title="${t('手机远程设置','Mobile remote settings')}">${remoteDeviceIcon()}</button>`;
  const screensaverTrigger = () => `<button class="wb-screensaver-trigger" data-wb-action="screensaver" data-testid="screensaver-trigger" aria-label="${t('预览地球屏保','Preview globe screensaver')}" title="${t('预览地球屏保','Preview globe screensaver')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.8 17 12l-8.5 5.2V6.8Z"/><path d="M4.5 4.5h15v15h-15z"/></svg></button>`;
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(manual)); localStorage.setItem(PROSPECT_STORAGE_KEY, JSON.stringify(prospectDemo)); if (receipt) localStorage.setItem(receiptKey, JSON.stringify(receipt)); else localStorage.removeItem(receiptKey); } catch { notice = t('浏览器存储不可用，请导出备份','Browser storage unavailable. Export a backup.'); } }
  function pause() { playing = false; window.clearTimeout(timer); }
  function schedule() {
    window.clearTimeout(timer);
    if (playing) timer = window.setTimeout(() => {
      if (document.hidden) { schedule(); return; }
      if (step < scenes.length - 1) goStep(step + 1); else { pause(); render(); }
    }, 7000);
  }
  function goStep(index: number) { step = Math.max(0, Math.min(scenes.length - 1,index)); view = scenes[step].view as View; selected = 'TASK-001'; filter = 'all'; notice = ''; if (step <= 3) draftMode = 'outreach'; else if (step >= 6) draftMode = 'reply'; if (step === scenes.length - 1) pause(); render('view'); schedule(); }
  function playback() {
    if (step < 0) return `<section class="wb-tour-invite"><div class="tour-symbol">▷</div><div><strong>${t('看看两条业务线如何协同','See both business lines working together')}</strong><p>${t('10 个步骤：开发新客户、处理老客户来信，再汇入同一套审核与跟进流程','10 steps: develop new customers, handle existing-customer mail, then share one review and follow-up flow')}</p></div>${btn(t('播放演练','Play rehearsal'),'tour-start',true)}</section>`;
    const scene = scenes[step];
    return `<section class="wb-player" aria-label="${t('演练控制','Rehearsal controls')}" data-step="${step}"><div class="player-top"><span class="wb-badge blue">● ${t('演练进行中 · 当前功能已高亮','REHEARSAL LIVE · CURRENT FUNCTION HIGHLIGHTED')}</span><span class="wb-mono">${scene.time} / ${step+1} OF ${scenes.length}</span><div class="player-controls">${btn('↶ '+t('重播','Restart'),'tour-restart')}${btn(t('退出演练','Exit rehearsal'),'tour-exit')}</div></div><div class="player-story" aria-live="polite"><h2>${t(scene.zh,scene.en)}</h2><p>${t(scene.noteZh,scene.noteEn)}</p></div><div class="player-bottom"><div class="player-steps">${scenes.map((s,i)=>`<button data-step="${i}" class="${i === step ? 'active' : i < step ? 'passed' : ''}" aria-label="${i+1}. ${t(s.zh,s.en)}" ${i===step?'aria-current="step"':''}>${i+1}</button>`).join('')}</div><div class="player-controls">${btn('← '+t('上一步','Previous'),'tour-prev',false,step===0)}${btn(playing ? 'Ⅱ '+t('暂停','Pause') : '▷ '+t('继续播放','Play'),'tour-play',true,step===scenes.length-1)}${btn(t('下一步','Next')+' →','tour-next',false,step===scenes.length-1)}</div></div></section>`;
  }
  const tourFocusSelectors = ['.wb-prospect-brief','.wb-prospect-results','.wb-prospect-dossier','.wb-prospect-action','.wb-task-list','.wb-mail-layout > section.wb-panel','.wb-draft-editor','.wb-review-aside','.wb-receipt','.wb-team-layout > section.wb-panel'] as const;
  function applyTourFocus() {
    if (step < 0) return;
    const shell=root.querySelector<HTMLElement>('.wb-shell');
    const nav=root.querySelector<HTMLElement>(`.wb-nav[data-view="${view}"]`);
    const target=root.querySelector<HTMLElement>(tourFocusSelectors[step]);
    if (!shell || !nav || !target) return;
    shell.classList.add('is-rehearsing');
    shell.dataset.rehearsalStep=String(step+1);
    nav.classList.add('tour-live');
    target.classList.add('wb-tour-focus');
    target.dataset.tourFocus=`${step+1}`;
    target.setAttribute('aria-label',`${t('演练当前功能','Current rehearsal function')} ${step+1}: ${t(scenes[step].zh,scenes[step].en)}`);
    window.requestAnimationFrame(()=>target.scrollIntoView({block:'nearest',behavior:'smooth'}));
  }
  function metrics() {
    const list=tasks(), done=list.filter(x=>x.status==='done').length;
    const count=ownsWork() && state().draft.status!=='empty' ? 1:0;
    return `<div class="wb-metrics">${[[t('今日任务','Today’s tasks'),list.length,t('同一批任务','One shared task list')],[t('已完成','Completed'),done,t('附有完成依据','With completion evidence')],[t('待跟进','Needs follow-up'),list.length-done,t('查看卡点与下一步','See blockers and next steps')],[t('回复草稿','Reply drafts'),count,t('仍由业务员审核发送','Reviewed and sent by a human')]].map(([label,num,note])=>`<div><span>${label}</span><strong>${String(num).padStart(2,'0')}</strong><small>${note}</small></div>`).join('')}</div>`;
  }
  function taskRows(compact=false) {
    const list=tasks().filter(x=>filter==='all'||(filter==='done'?x.status==='done':x.status!=='done'));
    return list.map(x=>`<button class="wb-task ${selected===x.id&&!compact?'selected':''}" data-task="${x.id}"><span class="task-dot ${x.status==='done'?'complete':''}">${x.status==='done'?'✓':'•'}</span><span class="task-copy"><small>${x.id} / ${x.id==='TASK-001'?'Nordic Tools':x.id==='TASK-002'?t('经理安排','Manager assignment'):'Atlas Studio'}</small><strong>${title(x.id)}</strong><span>${x.id==='TASK-001'?t('下班前 · 价格/交期待确认','End of day · price/delivery unconfirmed'):x.id==='TASK-002'?t('12:00 前 · 汇总提交','By 12:00 · submit report'):t('期限待确认 · 部门协作','Deadline unconfirmed · team request')}</span></span><span class="wb-badge ${x.status==='needs_confirmation'?'blue':''}">${status(x.status)}</span><span class="task-arrow">↗</span></button>`).join('') || `<div class="wb-empty">${t('当前没有符合条件的任务','No tasks match this view')}</div>`;
  }
  function globe() {
    let market = localStorage.getItem('cardbot_market') || 'Asia/Shanghai'; if (!cities.some(c=>c[0]===market)) market='Asia/Shanghai';
    return `<section class="wb-world wb-panel"><div class="wb-panel-head"><h2>${t('全球，与你同频','Your world, in sync')}</h2><span class="wb-mono">GLOBAL TRADE</span></div><div class="wb-earth"><canvas id="text-earth" role="img" tabindex="0" aria-label="${t('文字地球，可拖拽或使用左右方向键','Text Earth; drag or use the arrow keys')}"></canvas><span class="earth-plus">+</span></div><div class="wb-zones">${cities.slice(0,6).map(c=>`<div class="wb-zone" data-zone="${c[0]}"><b>${t(c[1],c[2])}</b><time>--:--</time><small></small></div>`).join('')}</div><div class="wb-market"><label for="city">${t('关注市场','Follow a market')}</label><select id="city">${cities.map(c=>`<option value="${c[0]}" ${c[0]===market?'selected':''}>${t(c[1],c[2])}</option>`).join('')}</select><time id="market-time"></time></div><p class="wb-caption">${t('演示城市 · 时钟实时更新 · 可拖动地球','Demo cities · live clocks · drag to explore')}</p></section>`;
  }
  function sharedWorkflow() {
    const steps = [[t('查资料','Research'),t('客户背景与历史','Company and history')],[t('做判断','Decide'),t('现在该做什么','What to do next')],[t('写草稿','Draft'),t('AI 先写','AI prepares')],[t('人审核','Review'),t('确认后再流转','Human confirms')],[t('留记录','Audit'),t('过程与责任可追溯','Traceable actions')]];
    return `<section class="wb-dual-flow wb-panel"><div class="wb-panel-head"><div><span class="wb-kicker">TWO ENTRIES · ONE WORKFLOW</span><h2>${t('两条业务线，共用一套工作机制','Two business lines, one operating system')}</h2></div><span class="wb-badge blue">${t('统一规则','SHARED RULES')}</span></div><div class="wb-dual-flow-body"><div class="wb-flow-entrances"><button data-view="prospecting"><span>01</span><strong>${t('开发新客户','Develop new customers')}</strong><small>${t('先找到值得开发的企业','Find companies worth pursuing')}</small><i>↗</i></button><button data-view="evidence"><span>02</span><strong>${t('服务现有客户','Support existing customers')}</strong><small>${t('从来信和历史沟通开始','Start from incoming mail and history')}</small><i>↗</i></button></div><div class="wb-flow-merge" aria-hidden="true"><span></span><b>→</b></div><div class="wb-shared-steps">${steps.map(([label,note],i)=>`<div><span>0${i+1}</span><strong>${label}</strong><small>${note}</small></div>`).join('')}</div></div></section>`;
  }
  function activeProspectStage(): ProspectStage {
    if (step < 0 || view !== 'prospecting') return prospectDemo.stage;
    return ([0,1,3,5] as ProspectStage[])[Math.min(step,3)];
  }
  function prospecting() {
    if(!ownsWork()) return `<section class="wb-panel wb-empty access-boundary"><span class="empty-icon">⌁</span><h2>${t('这些开发任务属于 Jojo','These development tasks belong to Jojo')}</h2><p>${t('切换到 Jojo，可以查看从目标企业到开发邮件的完整过程。','Switch to Jojo to see the full journey from target company to outreach draft.')}</p></section>`;
    const stage=activeProspectStage();
    const stageNames=[[t('定目标','Define target'),t('说清楚要找谁','Describe the ideal customer')],[t('找企业','Discover'),t('筛出匹配公司','Find matching companies')],[t('查背景','Research'),t('核对业务和时机','Verify business and timing')],[t('做判断','Qualify'),t('说明为什么值得开发','Explain why it is worth pursuing')],[t('找对人','Find contact'),t('找到负责人和来源','Find the owner and source')],[t('准备沟通','Prepare'),t('形成切入点与草稿','Create an angle and draft')]];
    const primary=prospects[0];
    return `<section class="wb-panel wb-prospect-process"><div class="wb-panel-head"><div><span class="wb-kicker">NEW BUSINESS DEVELOPMENT</span><h2>${t('不是只找邮箱，而是找到值得开发的客户','Not just emails—find customers worth pursuing')}</h2></div><span class="wb-badge blue">${t('当前阶段','CURRENT')} 0${stage+1}</span></div><div class="wb-prospect-rail">${stageNames.map(([label,note],i)=>`<button data-prospect-stage="${i}" class="${i===stage?'active':i<stage?'passed':''}" ${step>=0?'disabled':''}><span>0${i+1}</span><strong>${label}</strong><small>${note}</small></button>`).join('')}</div></section><div class="wb-prospect-grid"><aside class="wb-panel wb-prospect-brief"><div class="wb-panel-head"><h2>${t('目标客户','Ideal customer')}</h2><span class="wb-badge">ICP-01</span></div><dl class="wb-prospect-dl"><div><dt>${t('产品','Product')}</dt><dd>CB-20 ${t('家居五金','hardware')}</dd></div><div><dt>${t('市场','Market')}</dt><dd>${t('北欧与西欧','Nordics & Western Europe')}</dd></div><div><dt>${t('客户类型','Customer type')}</dt><dd>${t('住宅开发商 / 精装承包商','Residential developer / fit-out contractor')}</dd></div><div><dt>${t('排除','Exclude')}</dt><dd>${t('零售门店、无项目依据','Retail-only, no project evidence')}</dd></div></dl><p>${t('先定义“什么企业值得找”，再开始搜索。','Define what is worth finding before searching.')}</p>${stage===0?btn(t('开始寻找匹配企业','Find matching companies'),'prospect-next',true,step>=0):''}</aside><section class="wb-panel wb-prospect-results ${stage<1?'is-pending':''}"><div class="wb-panel-head"><h2>${t('匹配企业','Matched companies')}</h2><span class="wb-badge">03</span></div>${prospects.map((item,i)=>`<button class="wb-prospect-row ${prospectDemo.selectedId===item.id?'active':''}" data-prospect-select="${item.id}" ${step>=0?'disabled':''}><span class="wb-prospect-rank">0${i+1}</span><span><strong>${item.company}</strong><small>${t(item.countryZh,item.countryEn)} · ${item.website}</small></span><b>${item.score}</b><em>${t(item.fitZh,item.fitEn)}</em></button>`).join('')}<div class="wb-prospect-hint"><span>✓</span><p>${t('先看企业匹配和业务信号，联系方式只是后续质量门槛。','Company fit and business signals come first; contact data is a later quality gate.')}</p></div>${stage===1?btn(t('查看企业背景依据','Review company evidence'),'prospect-next',true,step>=0):''}</section><article class="wb-panel wb-prospect-dossier ${stage<2?'is-pending':''}"><div class="wb-panel-head"><div><span class="wb-kicker">${primary.id}</span><h2>${primary.company}</h2></div><strong class="wb-prospect-score">${primary.score}<small>/100</small></strong></div><div class="wb-prospect-facts"><div><span>${t('为什么匹配','WHY IT FITS')}</span><p>${t(primary.reasonZh,primary.reasonEn)}</p></div><div><span>${t('为什么是现在','WHY NOW')}</span><p>${t(primary.signalZh,primary.signalEn)}</p></div><div><span>${t('资料依据','SOURCES')}</span><p>${t('企业官网、项目新闻、展会公开名录','Company website, project news, public trade-fair directory')}</p></div></div><div class="wb-prospect-verdict"><span>✓</span><div><strong>${t('值得开发，但不自动联系','Worth pursuing; no automatic outreach')}</strong><p>${t('判断有依据，下一步才是确认负责人和沟通方式。','The decision has evidence. Next, confirm the owner and contact route.')}</p></div></div>${stage>=2&&stage<5?btn(t('继续完善客户开发判断','Continue qualification'),'prospect-next',true,step>=0):''}</article><aside class="wb-panel wb-prospect-action ${stage<4?'is-pending':''}"><div class="wb-panel-head"><h2>${t('负责人和切入点','Contact & angle')}</h2><span class="wb-badge blue">${stage>=5?t('可准备草稿','DRAFT READY'):t('待完善','IN PROGRESS')}</span></div><div class="wb-contact-card"><span>ES</span><div><strong>${primary.contact}</strong><p>${t(primary.roleZh,primary.roleEn)}</p><small>${primary.email}</small></div></div><div class="wb-source-line"><span>${t('联系方式来源','CONTACT SOURCE')}</span><p>${t(primary.sourceZh,primary.sourceEn)}</p></div><div class="wb-angle"><span>${t('合作切入点','COOPERATION ANGLE')}</span><strong>${t(primary.angleZh,primary.angleEn)}</strong></div>${stage<5?btn(t('形成合作切入点','Prepare the approach'),'prospect-next',true,step>=0||stage<4):btn(t('进入统一草稿审核','Open shared draft review')+' →','draft-outreach',true,step>=0)}</aside></div>`;
  }
  function overview() {
    return `<div class="wb-welcome"><div><span class="wb-kicker">${t('你的全球业务，都在同一个工作日','YOUR WORLD. IN ONE WORKDAY.')}</span><h1><span id="shanghai-greeting">${getShanghaiGreeting(locale==='zh'?'zh':'en')}</span>，${isManager()?t('陈经理','Chen'):(users.find(u=>u.id===actor())?.name||'Jojo')}</h1><p>${t('从开发新客户，到服务老客户，每一步都有据可依','From new-business development to existing-customer service, every step is grounded in evidence')}</p></div><span class="wb-date" id="shanghai-date"></span></div>${metrics()}${playback()}${sharedWorkflow()}<div class="wb-overview-grid"><section class="wb-panel"><div class="wb-panel-head"><div><span class="wb-kicker">YOUR NEXT MOVES</span><h2>${t('今天，从这里开始','Your next moves today')}</h2></div><button class="wb-link" data-view="workday">${t('全部任务','All tasks')} ↗</button></div>${taskRows(true)}<div class="wb-next"><span>↗</span><div><strong>${t('先解决报价里的不确定','Start with what blocks the quote')}</strong><p>${t('新价格和交期尚未确认，查看历史沟通后再回复','Pricing and delivery need confirmation. Read the history before replying.')}</p><button class="wb-link" data-view="evidence">${t('打开客户邮件','Open customer mail')} →</button></div></div></section>${globe()}</div>`;
  }
  function taskDetail() {
    const x=tasks().find(x=>x.id===selected); if(!x) return `<section class="wb-panel wb-empty">${t('此身份暂无任务。可切换 Jojo 体验完整工作日。','No tasks assigned. Switch to Jojo to explore a complete workday.')}</section>`;
    return `<article class="wb-panel wb-task-detail"><div class="wb-panel-head"><span class="wb-kicker">${x.id} / ${t('任务详情','TASK DETAILS')}</span><span class="wb-badge">${status(x.status)}</span></div><h2>${title(x.id)}</h2><dl class="wb-meta"><div><dt>${t('负责人','Assigned to')}</dt><dd>Jojo</dd></div><div><dt>${t('来源','Source')}</dt><dd>${x.source.split(' · ')[0]}</dd></div></dl><blockquote>${esc(x.quote)}</blockquote><div class="wb-fact"><b>${t('待确认','Needs confirmation')}</b><p>${missing(x.id)}</p></div>${x.status==='done'?`<div class="wb-proof"><strong>✓ ${t('完成依据','Completion evidence')}</strong><p>${esc(x.evidence)}</p></div>`:`<label class="wb-field">${t('记录完成依据','Record completion evidence')}<textarea id="completion-evidence" rows="3" placeholder="${t('填写提交记录、客户确认等依据','Add a submission reference or customer confirmation')}" ${step>=0?'disabled':''}></textarea></label><div class="wb-actions">${x.id==='TASK-001'?`<button class="wb-button" data-view="evidence">${t('查阅历史邮件','Read email history')} ↗</button>`:''}${btn(t('确认完成','Confirm complete'),'complete',true,step>=0)}</div>`}</article>`;
  }
  function workday() {
    return `${metrics()}<div class="wb-view-tools"><div class="wb-tabs">${['all','open','done'].map(f=>`<button data-filter="${f}" class="${filter===f?'active':''}">${f==='all'?t('全部任务','All tasks'):f==='open'?t('待跟进','Needs follow-up'):t('已完成','Completed')}</button>`).join('')}</div><div class="wb-tabs"><button data-wb-action="morning" class="${state().phase==='morning'?'active':''}">${t('早间清单','Morning list')}</button><button data-wb-action="evening" class="${state().phase==='evening'?'active':''}">${t('晚间复盘','Evening recap')}</button></div></div><div class="wb-split"><section class="wb-panel wb-task-list">${taskRows()}${state().phase==='evening'?`<div class="wb-next recap"><span>◷</span><div><strong>${t('下班前，还差这些','Before you sign off')}</strong>${tasks().filter(x=>x.status!=='done').map(x=>`<p><b>${title(x.id)}</b><br>${t('缺少：','Missing: ')}${missing(x.id)}<br>${t('下一步：联系负责人核实并记录结果','Next: ask the owner to confirm and record the outcome')}</p>`).join('')||`<p>${t('本批任务均已确认完成','All tasks have completion evidence')}</p>`}<p>${t('草稿已保存 ≠ 报价已发送','Draft saved ≠ quotation sent')}</p></div></div>`:''}</section>${taskDetail()}</div>`;
  }
  function evidence() {
    if(!ownsWork()) return emptyMailbox();
    return `<div class="wb-mail-layout"><aside class="wb-panel wb-mail-list"><div class="wb-panel-head"><h2>${t('客户会话','Conversations')}</h2><span class="wb-badge">01</span></div><div class="wb-client active"><span class="wb-avatar">NT</span><div><strong>Nordic Tools</strong><p>${t('询价 · 瑞典','Quotation · Sweden')}</p></div></div><div class="wb-mail-summary"><span class="wb-kicker">CB-20 / 200 UNITS</span><h3>${t('新版报价沟通','Revised quotation')}</h3><p>${t('2 封往来邮件 · 1 项关联任务','2 emails · 1 linked task')}</p><span class="wb-badge blue">${t('价格与交期待确认','Price and delivery unconfirmed')}</span></div></aside><section class="wb-panel"><div class="wb-panel-head"><h2>${t('历史邮件','Email history')}</h2><span class="wb-kicker">${t('虚构案例','FICTIONAL CASE')}</span></div>${mailHistory.map(m=>`<article id="${m.id}" class="wb-mail ${focusMail===m.id?'highlight':''}"><div><strong>${m.from}</strong><time>${m.date}</time></div><h3>${m.subject}</h3><p>${m.body}</p><span class="wb-kicker">${m.id}</span></article>`).join('')}</section><aside class="wb-panel wb-evidence"><div class="wb-panel-head"><h2>${t('事实依据','Evidence')}</h2></div><div class="wb-evidence-item"><span class="wb-badge">${t('已确认','Confirmed')}</span><h3>CB-20 · 200 units</h3><p>${t('产品型号与询价数量来自客户本次来信','Product and quantity come from the customer’s latest email')}</p><button data-mail="EMAIL-001" class="wb-link">EMAIL-001 ↗</button></div><div class="wb-evidence-item"><span class="wb-badge blue">${t('待核实','Unconfirmed')}</span><h3>${t('新版价格 / 交期','Revised price / delivery')}</h3><p>${t('旧报价已过期，不可沿用。尚无新的确认记录。','The old quote has expired. No new confirmation is available.')}</p><button data-mail="EMAIL-000" class="wb-link">EMAIL-000 ↗</button></div><div class="wb-evidence-item"><h3>${t('下一步','Next step')}</h3><p>${t('先确认收到询价，再向产品负责人核实价格与交期','Acknowledge the inquiry, then confirm pricing and delivery with the product owner')}</p>${btn(t('准备回复草稿','Prepare reply draft')+' ↗','generate',true,step>=0)}</div></aside></div>`;
  }
  function emptyMailbox() { return `<section class="wb-panel wb-empty access-boundary"><span class="empty-icon">✉</span><h2>${t('这个会话属于 Jojo','This conversation belongs to Jojo')}</h2><p>${t('当前身份没有此邮件的演示访问权限','This demo identity cannot access this conversation')}</p></section>`; }
  function outreachDraft() {
    const approved=prospectDemo.outreachStatus==='approved'||prospectDemo.outreachStatus==='saved_local';
    const saved=prospectDemo.outreachStatus==='saved_local';
    const readonly=step>=0;
    return `<div class="wb-draft-switch"><div class="wb-tabs"><button data-wb-action="draft-outreach" class="active">${t('新客户开发信','New-customer outreach')}</button><button data-wb-action="draft-reply">${t('现有客户回复','Existing-customer reply')}</button></div><span>${t('两条业务线使用同一套事实、审核与留痕规则','Both lines share the same evidence, review and audit rules')}</span></div><div class="wb-draft-layout"><article class="wb-panel wb-draft-editor"><div class="wb-panel-head"><div><span class="wb-kicker">PROSPECT-001 / AURORA HABITAT AB</span><h2>${t('开发邮件','Outreach email')}</h2></div><span class="wb-badge blue" id="outreach-status">${saved?t('已保存本地草稿','Saved locally'):approved?t('已审核 · 待保存','Reviewed · ready to save'):t('待人工审核','Awaiting human review')}</span></div><dl class="wb-envelope"><div><dt>${t('收件人','To')}</dt><dd>elin.sjoberg@aurora-habitat.example</dd></div><div><dt>${t('主题','Subject')}</dt><dd>CB-20 sample kit for Aurora Habitat</dd></div><div><dt>${t('所属业务员','Owner')}</dt><dd>Jojo · DEMO-U-2001</dd></div></dl><label class="wb-field">${t('邮件正文','Message')}<textarea rows="12" readonly>${esc(outreachBody)}</textarea></label><label class="wb-review"><input type="checkbox" id="outreach-review-check" ${approved?'checked':''} ${readonly||saved?'disabled':''}>${t('我已核对企业背景、联系人来源、合作切入点和正文','I checked the company evidence, contact source, approach and message')}</label><div class="wb-actions">${btn(t('人工审核通过','Approve review'),'approve-outreach',false,readonly||approved)}${btn(t('保存本地草稿','Save local draft'),'save-outreach',true,readonly||!approved||saved)}</div>${saved?`<p class="wb-save-note save-receipt">${t('已进入统一草稿记录 · 未发送 · 未写入真实小满','Added to the shared draft record · not sent · not written to real OKKI')}</p>`:''}</article><aside class="wb-panel wb-review-aside"><div class="wb-panel-head"><h2>${t('这封开发信为什么能写','Why this outreach is grounded')}</h2></div><ul class="wb-checklist"><li>✓ ${t('企业符合目标客户条件','Company matches the ideal customer profile')}</li><li>✓ ${t('近期项目是公开业务信号','Recent project is a public business signal')}</li><li>✓ ${t('联系人职位与来源已记录','Contact role and source are recorded')}</li><li>✓ ${t('切入点对应样板间选型时间','Approach matches the sample-room timing')}</li><li>○ ${t('价格和交期没有擅自承诺','No unconfirmed price or delivery promise')}</li></ul><button class="wb-link" data-view="prospecting">${t('返回客户开发依据','Return to prospect evidence')} ↗</button><div class="wb-note"><strong>${t('统一的人审门槛','One human review gate')}</strong><p>${t('不论是开发信还是老客户回复，CardBot 都只准备草稿；业务员确认后才进入下一环节。','Whether outreach or an existing-customer reply, CardBot only prepares a draft. A salesperson must approve the next step.')}</p></div></aside></div>`;
  }
  function draft() {
    if(!ownsWork()) return emptyMailbox();
    if(draftMode==='outreach') return outreachDraft();
    const d=state().draft, readonly=step>=0;
    const draftState=d.status==='empty'?t('尚未生成','Not generated'):d.status==='awaiting_review'?t('待人工审核','Awaiting human review'):d.status==='approved'?t('已审核 · 待保存','Reviewed · ready to save'):t('已保存至本地','Saved locally');
    return `<div class="wb-draft-layout"><article class="wb-panel wb-draft-editor"><div class="wb-panel-head"><h2>${t('报价回复','Quotation reply')}</h2><span class="wb-badge blue" id="draft-status">${draftState}</span></div><dl class="wb-envelope"><div><dt>${t('收件人','To')}</dt><dd>purchasing@nordic-tools.example</dd></div><div><dt>${t('主题','Subject')}</dt><dd>Re: CB-20 inquiry</dd></div><div><dt>${t('所属业务员','Owner')}</dt><dd>Jojo · DEMO-U-2001</dd></div></dl>${d.status==='empty'?`<div class="wb-empty"><h3>${t('先有事实，再有回复','Facts before the reply')}</h3><p>${t('依据客户来信，准备待人工审核的回复','Prepare a reply from the customer’s email for review')}</p>${btn(t('生成演示草稿','Generate demo draft'),'generate',true,readonly)}</div>`:`<label class="wb-field">${t('邮件正文','Message')}<textarea id="draft-body" rows="10" ${readonly?'readonly':''}>${esc(d.body)}</textarea></label><label class="wb-review"><input type="checkbox" id="review-check" ${readonly?'disabled':''} ${d.status==='approved'||d.status==='saved_local'?'checked':''}>${t('我已核对来源、收件人和正文，没有未经确认的业务承诺','I checked the sources, recipient and text for unconfirmed commitments')}</label><div class="wb-actions">${btn(t('人工审核通过','Approve review'),'approve',false,readonly||d.status!=='awaiting_review')}${btn(t('保存本地草稿','Save local draft'),'save-local',false,readonly||d.status!=='approved')}${btn(t('保存到小满 · 模拟','Save to OKKI · simulation'),'save-sim',true,readonly||!['approved','saved_local'].includes(d.status))}</div>${d.savedAt?`<p class="wb-save-note save-receipt">${t('已保留草稿内容 · 未发送 · 未写入真实小满','Draft retained · not sent · not written to real OKKI')}</p>`:''}`}</article><aside class="wb-panel wb-review-aside"><div class="wb-panel-head"><h2>${t('发送前，先核对','Check before sending')}</h2></div><ul class="wb-checklist"><li>✓ ${t('型号 CB-20，数量 200','Model CB-20, quantity 200')}</li><li>✓ ${t('收件人与当前会话一致','Recipient matches the conversation')}</li><li>○ ${t('价格与交期待内部确认','Price and delivery need confirmation')}</li><li>○ ${t('没有自动对外发送','No automatic external sending')}</li></ul><button class="wb-link" data-view="evidence">${t('返回邮件依据','Return to sources')} ↗</button><div class="wb-note"><strong>${t('预置草稿演示','Preset draft demonstration')}</strong><p>${t('当前展示接入后的操作流程；真实 DeepSeek 与小满尚未连接。修改后必须重新审核。','This previews the connected workflow. DeepSeek and OKKI are not connected. Editing requires a new review.')}</p></div>${!readonly&&d.status!=='empty'?btn(t('演示保存失败','Simulate save failure'),'save-fail'):''}</aside></div>`;
  }
  function outbox() {
    if(!ownsWork()) return emptyMailbox();
    if(step<0&&draftMode==='outreach'&&prospectDemo.outreachStatus==='saved_local') return `<div class="wb-sim-heading"><span class="wb-badge blue">${t('统一草稿记录','SHARED DRAFT RECORD')}</span><p>${t('开发信与客户回复共用审核和留痕机制；当前记录只保存在浏览器','Outreach and replies share one review and audit mechanism; this record only exists in the browser')}</p></div><div class="wb-outbox-layout"><section class="wb-panel"><div class="wb-panel-head"><h2>${t('Jojo 的草稿','Jojo’s drafts')}</h2><span class="wb-badge">01</span></div><div class="wb-client active"><span class="wb-avatar">⌁</span><div><strong>CB-20 sample kit</strong><p>Aurora Habitat AB · ${t('开发邮件','Outreach')}</p></div></div><div class="wb-mail-summary"><span class="wb-kicker">LOCAL-OUTREACH-001</span><p>${t('已记录客户依据、联系人来源和人工审核状态','Company evidence, contact source and human review are recorded')}</p><span class="wb-badge">✓ ${t('本地保存完成','Saved locally')}</span></div></section><article class="wb-panel wb-receipt"><div class="wb-panel-head"><h2>CB-20 sample kit for Aurora Habitat</h2><span class="wb-badge blue">${t('未发送','Not sent')}</span></div><dl class="wb-envelope"><div><dt>${t('收件人','To')}</dt><dd>elin.sjoberg@aurora-habitat.example</dd></div><div><dt>${t('草稿编号','Draft ID')}</dt><dd>LOCAL-OUTREACH-001</dd></div></dl><pre>${esc(outreachBody)}</pre><div class="wb-proof"><strong>${t('审计摘要','Audit summary')}</strong><p>${t('Jojo 完成人工审核；来源包括官网、项目新闻和公开展会名录。真实小满写入与发送仍未发生。','Jojo completed human review. Sources include the website, project news and a public trade-fair directory. No real OKKI write or email send occurred.')}</p></div></article></div>`;
    const r=step>=0?(state().draft.status==='saved_local'?simulatedReceipt(state()):null):receipt;
    return `<div class="wb-sim-heading"><span class="wb-badge blue">${t('模拟小满草稿箱','SIMULATED OKKI DRAFT BOX')}</span><p>${t('展示接入后的保存与复核体验；不是真实小满页面','A preview of saving and verifying drafts after connection; not the real OKKI interface')}</p></div>${r?`<div class="wb-outbox-layout"><section class="wb-panel"><div class="wb-panel-head"><h2>${t('Jojo 的草稿','Jojo’s drafts')}</h2><span class="wb-badge">01</span></div><div class="wb-client active"><span class="wb-avatar">↗</span><div><strong>Re: CB-20 inquiry</strong><p>Nordic Tools · ${t('待销售最终审核','Awaiting final review')}</p></div></div><div class="wb-mail-summary"><span class="wb-kicker">${r.id}</span><p>${t('模拟读回：收件人、主题、正文一致','Simulated read-back: recipient, subject and body match')}</p><span class="wb-badge">✓ ${t('模拟校验通过','Simulated check passed')}</span></div></section><article class="wb-panel wb-receipt"><div class="wb-panel-head"><h2>${r.subject}</h2><span class="wb-badge blue">${t('未发送','Not sent')}</span></div><dl class="wb-envelope"><div><dt>${t('收件人','To')}</dt><dd>${r.to}</dd></div><div><dt>${t('草稿编号','Draft ID')}</dt><dd>${r.id}</dd></div></dl><pre>${esc(r.body)}</pre><div class="wb-proof"><strong>${t('演练保存回执','Rehearsal save receipt')}</strong><p>${t('来源：CardBot 模拟器。真实草稿箱、重新登录持久化验证仍待接入后验收。','Source: CardBot simulator. Real draft-box and re-login persistence checks remain to be verified after integration.')}</p></div></article></div>`:`<section class="wb-panel wb-empty"><span class="empty-icon">▤</span><h2>${t('还没有模拟保存的草稿','No simulated saved drafts yet')}</h2><p>${t('先生成回复，人工审核后点击“保存到小满 · 模拟”','Generate a reply, review it, then choose “Save to OKKI · simulation”')}</p><button class="wb-button primary" data-view="drafts">${t('前往草稿审核','Go to draft review')} ↗</button></section>`}`;
  }
  function team() {
    return `${metrics()}<div class="wb-team-layout"><section class="wb-panel"><div class="wb-panel-head"><h2>${t('团队工作进度','Team progress')}</h2><span class="wb-badge">${t('同一批任务','Shared task state')}</span></div>${users.filter(u=>u.id!=='manager').map(u=>{const list=u.id==='sales-01'?state().tasks:[];return `<div class="wb-team-member"><span class="wb-avatar">${u.name.slice(0,1)}</span><div><strong>${u.name}</strong><p>${t(u.zh,u.en)}</p></div><div><strong>${list.filter(x=>x.status==='done').length} / ${list.length}</strong><p>${t('已完成 / 任务','done / tasks')}</p></div></div>${list.map(x=>`<div class="wb-team-task"><strong>${title(x.id)}</strong><span class="wb-badge">${status(x.status)}</span><p>${x.status==='done'?esc(x.evidence):missing(x.id)}</p></div>`).join('')}`;}).join('')}</section><aside class="wb-panel"><div class="wb-panel-head"><h2>${t('需要经理关注','Needs your attention')}</h2></div><div class="wb-next"><span>↗</span><div><strong>${t('报价还缺两个确认','Two confirmations block the quote')}</strong><p>${t('Jojo 等待产品负责人提供新版价格和交期。已有草稿不会自动关闭该任务。','Jojo needs revised pricing and delivery from the product owner. Having a draft does not close the task.')}</p></div></div><div class="wb-note"><p>${t('经理汇总默认展示任务状态和完成依据。正式上线时邮件正文权限需要单独配置。','The manager summary shows task status and evidence. Production mailbox access must be configured separately.')}</p></div></aside></div>`;
  }
  function organization() {
    return `<div class="wb-org-grid"><section class="wb-panel wb-org-primary"><span class="wb-kicker">CARDBOT × OKKI</span><h2>${t('一套企业连接，各自的工作空间','One enterprise connection. Individual workspaces.')}</h2><p>${t('企业统一授权，业务员绑定自己的小满身份。当前用虚构账号演示未来流程。','The company authorizes access; each salesperson maps their OKKI identity. All accounts shown here are fictional.')}</p><span class="wb-badge">${t('模拟连接可用','Simulation available')}</span></section><section class="wb-panel"><div class="wb-panel-head"><h2>${t('连接状态','Connection status')}</h2></div><div class="wb-connection"><strong>${t('演练连接','Rehearsal connector')}</strong><span>${t('本地模拟','Local simulation')}</span></div><div class="wb-connection"><strong>OKKI API</strong><span>${t('等待企业授权','Awaiting company authorization')}</span></div><div class="wb-connection"><strong>DeepSeek</strong><span>${t('未接入 · 预置回复','Not connected · preset replies')}</span></div><div class="wb-connection"><strong>${t('历史邮件','Historical mail')}</strong><span>${t('虚构样本','Fictional samples')}</span></div></section></div><section class="wb-panel wb-identity-table"><div class="wb-panel-head"><h2>${t('成员与身份绑定','Members & identity mapping')}</h2><span class="wb-badge">4 ${t('位成员','members')}</span></div>${users.map((u,i)=>`<div class="wb-identity-row"><span class="wb-avatar">${u.name.slice(0,1)}</span><div><strong>${u.name}</strong><p>${t(u.zh,u.en)}</p></div><div><small>CARDBOT</small><p>${u.id}</p></div><div><small>OKKI USER ID</small><p>DEMO-U-${u.id==='manager'?'9001':u.id==='sales-01'?'2001':u.id==='sales-02'?'2002':'2003'}</p></div><span class="wb-badge">${t('模拟绑定','Mock binding')}</span></div>`).join('')}</section>`;
  }
  function remoteElement() {
    const template=document.createElement('template');
    template.innerHTML=renderRemotePanel(locale,remoteState,remoteSeed,remotePage).trim();
    return template.content.firstElementChild as HTMLElement;
  }
  function renderRemote(motion: RemoteMotion = 'update') {
    const existing=root.querySelector<HTMLElement>('.wb-remote-overlay');
    if(!remoteOpen){existing?.remove();return;}
    const next=remoteElement();
    const nextDialog=next.querySelector<HTMLElement>('.wb-remote-dialog');
    if(nextDialog)nextDialog.dataset.motion=motion;
    if(!existing){
      next.dataset.motion='open';root.append(next);
      window.setTimeout(()=>{if(next.isConnected){next.removeAttribute('data-motion');nextDialog?.removeAttribute('data-motion');}},900);
      return;
    }
    const currentDialog=existing.querySelector<HTMLElement>('.wb-remote-dialog');
    if(currentDialog&&nextDialog){
      currentDialog.replaceWith(nextDialog);
      window.setTimeout(()=>{if(nextDialog.isConnected)nextDialog.removeAttribute('data-motion');},900);
    }
  }
  function closeRemote() {
    remoteOpen=false;
    const overlay=root.querySelector<HTMLElement>('.wb-remote-overlay');
    if(!overlay)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){overlay.remove();return;}
    overlay.classList.add('is-closing');
    window.setTimeout(()=>{if(!remoteOpen&&overlay.isConnected)overlay.remove();},180);
  }
  function setRemotePage(nextPage: number, motion?: RemoteMotion) {
    const bounded=Math.max(0,Math.min(REMOTE_PRESENTATION_PAGE_COUNT-1,nextPage));
    if(bounded===remotePage)return;
    const direction=motion||(bounded>remotePage?'next':'previous');
    remotePage=bounded;
    renderRemote(direction);
  }
  function render(motion: RenderMotion = 'none') {
    releaseArt(); window.clearInterval(clock);
    document.documentElement.lang=locale==='zh'?'zh-CN':'en';
    if(!isManager()&&['team','organization'].includes(view)) view='overview';
    const activeUser=users.find(u=>u.id===actor())!;
    root.innerHTML=`<div class="wb-shell ${menuOpen?'menu-open':''} ${motion==='view'?'wb-view-enter':''}"><aside class="wb-sidebar"><div class="wb-brand-row"><a class="wordmark" href="/">cardbot<span>®</span></a><span data-bot-slot></span></div><div class="wb-company"><div><strong>${t('望京企业全球贸易','Wangjing Global Trade')}</strong><small>${t('企业工作空间','Enterprise workspace')}</small></div></div><span class="wb-kicker nav-section">WORKSPACE</span><nav aria-label="${t('工作台导航','Workspace navigation')}">${navs.filter(n=>isManager()||!['team','organization'].includes(n[0])).map(([id,icon,zh,en])=>`<button class="wb-nav ${view===id?'active':''}" data-view="${id}" ${view===id?'aria-current="page"':''}><span aria-hidden="true">${icon}</span>${t(zh,en)}${id==='outbox'?`<small>${t('模拟','SIM')}</small>`:''}</button>`).join('')}</nav><div class="wb-sidebar-bottom"><div class="wb-connector"><span class="connection-dot"></span><div><strong>${t('演练连接已就绪','Rehearsal ready')}</strong><small>${t('真实小满 API 待授权','Real OKKI API awaits authorization')}</small></div></div>${btn(t('重看品牌开场','Replay brand intro'),'intro')}</div></aside><div class="wb-main"><header class="wb-topbar"><div class="wb-breadcrumb"><button class="wb-menu" data-wb-action="menu" aria-expanded="${menuOpen}" aria-label="${t('打开功能菜单','Open navigation')}">☰</button><span>${t('工作空间','Workspace')}</span><span>/</span><strong>${nameOf(view)}</strong></div><div class="wb-top-actions"><time id="local-time"></time>${btn(locale==='zh'?'EN':'中文','language')}${btn(document.documentElement.dataset.theme==='dark'?t('◐ 浅色','◐ Light'):t('◐ 深色','◐ Dark'),'theme')}<label class="wb-user"><span class="sr-only">${t('切换演示身份','Switch demo identity')}</span><select id="demo-user">${users.map(u=>`<option value="${u.id}" ${actor()===u.id?'selected':''}>${u.name} · ${t(u.zh.split(' · ')[0],u.en.split(' · ')[0])}</option>`).join('')}</select></label></div></header><div class="wb-mode"><span><i></i>${t('交互演示','INTERACTIVE DEMO')}</span><p>${t('虚构业务数据 · 小满模拟接入 · 不发送邮件','Fictional business data · simulated OKKI connection · no emails sent')}</p></div><main class="wb-content" id="operations">${view!=='overview'?`<div class="wb-page-heading"><div><span class="wb-kicker">${step>=0?scenes[step].time:'DEMO-DAY-001'} / ${activeUser.name}</span><h1>${nameOf(view)}</h1></div>${step<0?btn('▷ '+t('播放演练','Play rehearsal'),'tour-start',true):''}</div>${step>=0?playback():''}`:''}<div id="notice" class="wb-notice" role="status" ${notice?'':'hidden'}>${esc(notice)}</div>${view==='overview'?overview():view==='prospecting'?prospecting():view==='workday'?workday():view==='evidence'?evidence():view==='drafts'?draft():view==='outbox'?outbox():view==='team'?team():organization()}<footer class="wb-footer"><span>${t('事实优先，始终由人把关','Evidence first. Humans always.')}</span>${btn(t('导出演示数据','Export demo data'),'export')}</footer></main></div></div>`;
    applyTourFocus();
    const prospectAction=root.querySelector<HTMLElement>('.wb-prospect-action [data-wb-action="prospect-next"]');
    if(prospectAction) prospectAction.dataset.wbAction='prospect-finish';
    if(view==='prospecting'&&activeProspectStage()>=4) root.querySelector('.wb-prospect-dossier > [data-wb-action="prospect-next"]')?.remove();
    root.querySelector('.wb-nav[data-view="outbox"] small')?.remove();
    root.querySelector('.wb-top-actions')?.insertAdjacentHTML('beforeend',screensaverTrigger()+remoteTrigger());
    if(remoteOpen) root.insertAdjacentHTML('beforeend',renderRemotePanel(locale,remoteState,remoteSeed,remotePage));
    botAssistant.mount({ locale, accountId:activeUser.id, accountName:activeUser.name });
    const canvas=root.querySelector<HTMLCanvasElement>('#text-earth');
    releaseArt=canvas?mountTextArt(canvas,'earth'):()=>{};
    updateClock(); clock=window.setInterval(updateClock,1000);
    idleScreensaver.reset();
  }
  function updateClock() {
    const now=new Date(); const time=root.querySelector('#local-time');
    if(time) time.textContent=now.toLocaleTimeString('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'})+' CST';
    const greeting=root.querySelector('#shanghai-greeting'); if(greeting) greeting.textContent=getShanghaiGreeting(locale==='zh'?'zh':'en',now);
    const date=root.querySelector('#shanghai-date'); if(date) date.textContent=now.toLocaleDateString(locale==='zh'?'zh-CN':'en-GB',{timeZone:'Asia/Shanghai',weekday:'long',month:'long',day:'numeric'});
    root.querySelectorAll<HTMLElement>('[data-zone]').forEach(el=>{const zone=el.dataset.zone!;el.querySelector('time')!.textContent=now.toLocaleTimeString('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit'});el.querySelector('small')!.textContent=new Intl.DateTimeFormat('en',{timeZone:zone,timeZoneName:'shortOffset'}).formatToParts(now).find(p=>p.type==='timeZoneName')!.value.replace('GMT','UTC');});
    const market=root.querySelector<HTMLSelectElement>('#city'), marketTime=root.querySelector('#market-time');if(market&&marketTime) marketTime.textContent=now.toLocaleTimeString('en-GB',{timeZone:market.value,hour:'2-digit',minute:'2-digit'});
  }
  function click(event: Event) {
    if ((event.target as HTMLElement).closest('[data-bot-action],.cb-chat-form')) return;
    const button=(event.target as HTMLElement).closest<HTMLElement>('button'); if(!button || (button as HTMLButtonElement).disabled)return;
    if(button.dataset.step!==undefined){pause();goStep(Number(button.dataset.step));return;}
    if(button.dataset.prospectStage!==undefined){pause();prospectDemo.stage=Math.max(0,Math.min(5,Number(button.dataset.prospectStage))) as ProspectStage;persist();render();return;}
    if(button.dataset.prospectSelect){pause();prospectDemo.selectedId=button.dataset.prospectSelect;persist();render();return;}
    if(button.dataset.view){pause();const nextView=button.dataset.view as View;if(nextView===view&& !menuOpen)return;view=nextView;menuOpen=false;notice='';render('view');return;}
    if(button.dataset.task){pause();selected=button.dataset.task;view='workday';render('view');return;}
    if(button.dataset.mail){pause();focusMail=button.dataset.mail;render();root.querySelector('#'+focusMail)?.scrollIntoView({block:'nearest'});return;}
    if(button.dataset.filter){pause();filter=button.dataset.filter;render();return;}
    if(button.dataset.remotePage!==undefined){setRemotePage(Number(button.dataset.remotePage),'jump');return;}
    const action=button.dataset.wbAction;if(!action)return;
    notice='';
    if(action.startsWith('tour-')){
      if(action==='tour-start'||action==='tour-restart'){playing=true;goStep(0);}
      if(action==='tour-play'){playing=!playing;render();schedule();}
      if(action==='tour-prev'||action==='tour-next'){pause();goStep(step+(action==='tour-prev'?-1:1));}
      if(action==='tour-exit'){pause();step=-1;view='overview';render();}
      return;
    }
    if(action==='language'){runCardbotLanguageTransition(()=>{locale=locale==='zh'?'en':'zh';localStorage.setItem('cardbot_locale',locale);render();});return;}
    if(action==='theme'){
      const control=(event.target as HTMLElement).closest<HTMLElement>('[data-wb-action="theme"]');
      toggleCardbotTheme(control||undefined,next=>{
        if(control)control.textContent=next==='dark'?t('◐ 浅色','◐ Light'):t('◐ 深色','◐ Dark');
      });
      return;
    }
    if(action==='menu'){menuOpen=!menuOpen;render();return;}
    if(action==='screensaver'){idleScreensaver.show();return;}
    if(action==='remote'){remoteOpen=true;remoteState='waiting';remotePage=0;renderRemote('open');return;}
    if(action==='remote-close'){closeRemote();return;}
    if(action==='remote-page-prev'){setRemotePage(remotePage-1,'previous');return;}
    if(action==='remote-page-next'){setRemotePage(remotePage+1,'next');return;}
    if(action==='remote-refresh'){remoteSeed+=1;remoteState='refreshed';renderRemote('update');return;}
    if(action==='remote-copy'){navigator.clipboard?.writeText(location.href).catch(()=>{});remoteState='copied';renderRemote('update');return;}
    if(action==='remote-stop'){remoteState='stopped';renderRemote('update');return;}
    if(action==='remote-channel'){remoteState='channels';renderRemote('update');return;}
    if(action==='intro'){dispose();onIntro();return;}
    if(action==='export'){const payload={kind:step>=0?'cardbot-rehearsal-snapshot':'cardbot-fictional-preview',prospecting:prospectDemo,draftMode,...state()};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cardbot-demo.json';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(step>=0){pause();notice=t('当前是演练回放，退出演练即可手动操作','This is a rehearsal playback. Exit to work manually.');render();return;}
    try {
      if(action==='morning'||action==='evening'){manual.phase=action;}
      else if(action==='prospect-next'||action==='prospect-finish'){prospectDemo.stage=Math.min(5,prospectDemo.stage+1) as ProspectStage;}
      else if(action==='draft-outreach'){draftMode='outreach';prospectDemo.stage=5;view='drafts';}
      else if(action==='draft-reply'){draftMode='reply';view='drafts';}
      else if(action==='approve-outreach'){if(!root.querySelector<HTMLInputElement>('#outreach-review-check')?.checked)throw new Error(t('请先核对企业依据、联系人来源和正文','Check the company evidence, contact source and message first'));prospectDemo.outreachStatus='approved';}
      else if(action==='save-outreach'){prospectDemo.outreachStatus='saved_local';draftMode='outreach';view='outbox';}
      else if(!ownsWork()) throw new Error(t('当前身份无此任务权限','This identity cannot access these tasks'));
      else if(action==='generate'){draftMode='reply';if(manual.draft.status==='empty')createDraft(manual);view='drafts';}
      else if(action==='approve'){if(!root.querySelector<HTMLInputElement>('#review-check')?.checked)throw new Error(t('请先勾选核对来源、收件人和正文','Check the source, recipient and text before approving'));approveDraft(manual);}
      else if(action==='save-local'){saveDraft(manual);}
      else if(action==='save-sim'){if(manual.draft.status==='approved')saveDraft(manual);receipt=simulatedReceipt(manual);view='outbox';}
      else if(action==='save-fail'){receipt=null;notice=t('模拟保存失败：连接超时。草稿内容已保留，可重试模拟保存。','Simulated save failure: connection timed out. Your draft is retained; retry the simulated save.');}
      else if(action==='complete'){completeTask(manual,selected,root.querySelector<HTMLTextAreaElement>('#completion-evidence')!.value);}
      persist();
    } catch(error){notice=error instanceof Error?error.message:t('操作未完成','Action not completed');}
    render();
  }
  function change(event: Event) {
    const target=event.target as HTMLSelectElement;
    if(target.id==='demo-user'){const leftRehearsal=step>=0;pause();step=-1;userId=target.value;localStorage.setItem('cardbot_demo_user',userId);view='overview';notice=leftRehearsal?t('已退出演练并切换账号','Rehearsal exited; account switched'):'';render();}
    if(target.id==='city'){localStorage.setItem('cardbot_market',target.value);updateClock();}
  }
  function input(event: Event) {
    const target=event.target as HTMLTextAreaElement;
    if(target.id==='draft-body'&&step<0&&ownsWork()){
      editDraft(manual,target.value);receipt=null;persist();
      root.querySelector('#draft-status')!.textContent=t('内容已修改 · 需重新审核','Edited · review required');
      root.querySelector<HTMLInputElement>('#review-check')!.checked=false;
      root.querySelector<HTMLButtonElement>('[data-wb-action="approve"]')!.disabled=false;
      root.querySelectorAll<HTMLButtonElement>('[data-wb-action="save-local"],[data-wb-action="save-sim"]').forEach(b=>b.disabled=true);
      root.querySelector('.save-receipt')?.remove();
    }
  }
  function keydown(event: KeyboardEvent){
    if(!remoteOpen)return;
    if(event.key==='Escape'){closeRemote();return;}
    if(event.key==='ArrowLeft'&&remotePage>0){event.preventDefault();setRemotePage(remotePage-1,'instant');return;}
    if(event.key==='ArrowRight'&&remotePage<REMOTE_PRESENTATION_PAGE_COUNT-1){event.preventDefault();setRemotePage(remotePage+1,'instant');}
  }
  function dispose(){pause();releaseArt();botAssistant.destroy();idleScreensaver.destroy();window.clearInterval(clock);root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('input',input);document.removeEventListener('keydown',keydown);}
  root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('input',input);
  document.addEventListener('keydown',keydown);
  const idleScreensaver=createIdleScreensaver(()=>locale,()=>{const current=users.find(user=>user.id===actor())!;return `${current.name} · ${t(current.zh.split(' · ')[0],current.en.split(' · ')[0])}`;});
  sessionStorage.setItem('cardbot_intro_v3','seen');render();return dispose;
}
