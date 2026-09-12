import './workbench.css';
import { mountTextArt } from './text-art';
import { getShanghaiGreeting as shanghaiGreeting } from './shanghai-greeting';
import { loadPreview, createDraft, editDraft, approveDraft, saveDraft, completeTask, STORAGE_KEY } from './preview-store';
import { scenes, rehearsalSnapshot, mailHistory, simulatedReceipt, type SimulatedReceipt } from './rehearsal';

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
type View = 'overview' | 'workday' | 'evidence' | 'drafts' | 'outbox' | 'team' | 'organization';
export function mountWorkbench(root: HTMLElement, onIntro: () => void) {
  const manual = loadPreview(localStorage);
  let locale = localStorage.getItem('cardbot_locale') === 'en' ? 'en' : 'zh';
  let userId = users.some(u => u.id === localStorage.getItem('cardbot_demo_user')) ? localStorage.getItem('cardbot_demo_user')! : 'sales-01';
  let view: View = 'overview', selected = 'TASK-001', step = -1, playing = false, timer = 0, clock = 0;
  let releaseArt = () => {}, menuOpen = false, filter = 'all', notice = '', focusMail = 'EMAIL-001';
  let receipt: SimulatedReceipt | null = null;
  const receiptKey = 'cardbot_simulated_receipt_v1';
  try { const value = JSON.parse(localStorage.getItem(receiptKey) || 'null'); if (value?.kind === 'simulation' && value.body === manual.draft.body && manual.draft.status === 'saved_local') receipt = value; } catch { /* Optional receipt. */ }
  const t = (zh: string, en: string) => locale === 'zh' ? zh : en;
  const state = () => step >= 0 ? rehearsalSnapshot(step) : manual;
  const actor = () => step >= 0 ? (step === 6 ? 'manager' : 'sales-01') : userId;
  const isManager = () => actor() === 'manager';
  const ownsWork = () => actor() === 'sales-01' || isManager();
  const tasks = () => ownsWork() ? state().tasks : [];
  const btn = (label: string, action: string, primary = false, disabled = false) => `<button class="wb-button ${primary ? 'primary' : ''}" data-wb-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  const status = (s: string) => s === 'done' ? t('已完成','Completed') : s === 'open' ? t('进行中','In progress') : t('待确认','Needs confirmation');
  const title = (id: string) => ({'TASK-001':t('准备新版报价回复','Prepare revised quotation reply'),'TASK-002':t('提交客户跟进汇总','Submit customer follow-up summary'),'TASK-003':t('确认样品寄送地址','Confirm sample shipping address')}[id] || id);
  const missing = (id: string) => ({'TASK-001':t('新版价格、供应商确认交期','Revised price and supplier-confirmed delivery'),'TASK-002':t('汇总提交记录','Report submission record'),'TASK-003':t('完整地址与确认记录','Full address and customer confirmation')}[id] || '');
  const navs: [View,string,string,string][] = [['overview','◈','工作总览','Overview'],['workday','☷','今日工作','My workday'],['evidence','✉','客户与邮件','Customers & mail'],['drafts','▤','草稿与审核','Drafts & review'],['outbox','↗','小满草稿箱','OKKI draft box'],['team','◷','团队进度','Team progress'],['organization','⚙','企业设置','Organization']];
  const nameOf = (v: View) => { const n = navs.find(n => n[0] === v)!; return t(n[2],n[3]); };
  function persist() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(manual)); if (receipt) localStorage.setItem(receiptKey, JSON.stringify(receipt)); else localStorage.removeItem(receiptKey); } catch { notice = t('浏览器存储不可用，请导出备份','Browser storage unavailable. Export a backup.'); } }
  function pause() { playing = false; window.clearTimeout(timer); }
  function schedule() {
    window.clearTimeout(timer);
    if (playing) timer = window.setTimeout(() => {
      if (document.hidden) { schedule(); return; }
      if (step < scenes.length - 1) goStep(step + 1); else { pause(); render(); }
    }, 7000);
  }
  function goStep(index: number) { step = Math.max(0, Math.min(scenes.length - 1,index)); view = scenes[step].view as View; selected = 'TASK-001'; filter = 'all'; notice = ''; if (step === scenes.length - 1) pause(); render(); schedule(); }
  function playback() {
    if (step < 0) return `<section class="wb-tour-invite"><div class="tour-symbol">▷</div><div><strong>${t('看看接入后的一个工作日','A workday, with everything connected')}</strong><p>${t('7 个步骤体验从邮件到草稿、从早间到晚间的完整流程','Experience the workflow from morning tasks to reviewed drafts in seven steps')}</p></div>${btn(t('播放演练','Play rehearsal'),'tour-start',true)}</section>`;
    const scene = scenes[step];
    return `<section class="wb-player" aria-label="${t('演练控制','Rehearsal controls')}" data-step="${step}"><div class="player-top"><span class="wb-badge blue">${t('接入演练 · 模拟数据','REHEARSAL · SIMULATED DATA')}</span><span class="wb-mono">${scene.time} / ${step+1} OF ${scenes.length}</span><div class="player-controls">${btn('↶ '+t('重播','Restart'),'tour-restart')}${btn(t('退出演练','Exit rehearsal'),'tour-exit')}</div></div><div class="player-story" aria-live="polite"><h2>${t(scene.zh,scene.en)}</h2><p>${t(scene.noteZh,scene.noteEn)}</p></div><div class="player-bottom"><div class="player-steps">${scenes.map((s,i)=>`<button data-step="${i}" class="${i === step ? 'active' : i < step ? 'passed' : ''}" aria-label="${i+1}. ${t(s.zh,s.en)}" ${i===step?'aria-current="step"':''}>${i+1}</button>`).join('')}</div><div class="player-controls">${btn('← '+t('上一步','Previous'),'tour-prev',false,step===0)}${btn(playing ? 'Ⅱ '+t('暂停','Pause') : '▷ '+t('继续播放','Play'),'tour-play',true,step===scenes.length-1)}${btn(t('下一步','Next')+' →','tour-next',false,step===scenes.length-1)}</div></div></section>`;
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
  function overview() {
    return `<div class="wb-welcome"><div><span class="wb-kicker">${t('你的全球业务，都在同一个工作日','YOUR WORLD. IN ONE WORKDAY.')}</span><h1><span id="shanghai-greeting">${getShanghaiGreeting(locale==='zh'?'zh':'en')}</span>，${isManager()?t('陈经理','Chen'):(users.find(u=>u.id===actor())?.name||'Jojo')}</h1><p>${t('每一次跟进，都有据可依','Every follow-up is grounded in evidence')}</p></div><span class="wb-date" id="shanghai-date"></span></div>${metrics()}${playback()}<div class="wb-overview-grid"><section class="wb-panel"><div class="wb-panel-head"><div><span class="wb-kicker">YOUR NEXT MOVES</span><h2>${t('今天，从这里开始','Your next moves today')}</h2></div><button class="wb-link" data-view="workday">${t('全部任务','All tasks')} ↗</button></div>${taskRows(true)}<div class="wb-next"><span>↗</span><div><strong>${t('先解决报价里的不确定','Start with what blocks the quote')}</strong><p>${t('新价格和交期尚未确认，查看历史沟通后再回复','Pricing and delivery need confirmation. Read the history before replying.')}</p><button class="wb-link" data-view="evidence">${t('打开客户邮件','Open customer mail')} →</button></div></div></section>${globe()}</div>`;
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
  function draft() {
    if(!ownsWork()) return emptyMailbox();
    const d=state().draft, readonly=step>=0;
    const draftState=d.status==='empty'?t('尚未生成','Not generated'):d.status==='awaiting_review'?t('待人工审核','Awaiting human review'):d.status==='approved'?t('已审核 · 待保存','Reviewed · ready to save'):t('已保存至本地','Saved locally');
    return `<div class="wb-draft-layout"><article class="wb-panel wb-draft-editor"><div class="wb-panel-head"><h2>${t('报价回复','Quotation reply')}</h2><span class="wb-badge blue" id="draft-status">${draftState}</span></div><dl class="wb-envelope"><div><dt>${t('收件人','To')}</dt><dd>purchasing@nordic-tools.example</dd></div><div><dt>${t('主题','Subject')}</dt><dd>Re: CB-20 inquiry</dd></div><div><dt>${t('所属业务员','Owner')}</dt><dd>Jojo · DEMO-U-2001</dd></div></dl>${d.status==='empty'?`<div class="wb-empty"><h3>${t('先有事实，再有回复','Facts before the reply')}</h3><p>${t('依据客户来信，准备待人工审核的回复','Prepare a reply from the customer’s email for review')}</p>${btn(t('生成演示草稿','Generate demo draft'),'generate',true,readonly)}</div>`:`<label class="wb-field">${t('邮件正文','Message')}<textarea id="draft-body" rows="10" ${readonly?'readonly':''}>${esc(d.body)}</textarea></label><label class="wb-review"><input type="checkbox" id="review-check" ${readonly?'disabled':''} ${d.status==='approved'||d.status==='saved_local'?'checked':''}>${t('我已核对来源、收件人和正文，没有未经确认的业务承诺','I checked the sources, recipient and text for unconfirmed commitments')}</label><div class="wb-actions">${btn(t('人工审核通过','Approve review'),'approve',false,readonly||d.status!=='awaiting_review')}${btn(t('保存本地草稿','Save local draft'),'save-local',false,readonly||d.status!=='approved')}${btn(t('保存到小满 · 模拟','Save to OKKI · simulation'),'save-sim',true,readonly||!['approved','saved_local'].includes(d.status))}</div>${d.savedAt?`<p class="wb-save-note save-receipt">${t('已保留草稿内容 · 未发送 · 未写入真实小满','Draft retained · not sent · not written to real OKKI')}</p>`:''}`}</article><aside class="wb-panel wb-review-aside"><div class="wb-panel-head"><h2>${t('发送前，先核对','Check before sending')}</h2></div><ul class="wb-checklist"><li>✓ ${t('型号 CB-20，数量 200','Model CB-20, quantity 200')}</li><li>✓ ${t('收件人与当前会话一致','Recipient matches the conversation')}</li><li>○ ${t('价格与交期待内部确认','Price and delivery need confirmation')}</li><li>○ ${t('没有自动对外发送','No automatic external sending')}</li></ul><button class="wb-link" data-view="evidence">${t('返回邮件依据','Return to sources')} ↗</button><div class="wb-note"><strong>${t('预置草稿演示','Preset draft demonstration')}</strong><p>${t('当前展示接入后的操作流程；真实 DeepSeek 与小满尚未连接。修改后必须重新审核。','This previews the connected workflow. DeepSeek and OKKI are not connected. Editing requires a new review.')}</p></div>${!readonly&&d.status!=='empty'?btn(t('演示保存失败','Simulate save failure'),'save-fail'):''}</aside></div>`;
  }
  function outbox() {
    if(!ownsWork()) return emptyMailbox();
    const r=step>=4?simulatedReceipt(state()):step>=0?null:receipt;
    return `<div class="wb-sim-heading"><span class="wb-badge blue">${t('模拟小满草稿箱','SIMULATED OKKI DRAFT BOX')}</span><p>${t('展示接入后的保存与复核体验；不是真实小满页面','A preview of saving and verifying drafts after connection; not the real OKKI interface')}</p></div>${r?`<div class="wb-outbox-layout"><section class="wb-panel"><div class="wb-panel-head"><h2>${t('Jojo 的草稿','Jojo’s drafts')}</h2><span class="wb-badge">01</span></div><div class="wb-client active"><span class="wb-avatar">↗</span><div><strong>Re: CB-20 inquiry</strong><p>Nordic Tools · ${t('待销售最终审核','Awaiting final review')}</p></div></div><div class="wb-mail-summary"><span class="wb-kicker">${r.id}</span><p>${t('模拟读回：收件人、主题、正文一致','Simulated read-back: recipient, subject and body match')}</p><span class="wb-badge">✓ ${t('模拟校验通过','Simulated check passed')}</span></div></section><article class="wb-panel wb-receipt"><div class="wb-panel-head"><h2>${r.subject}</h2><span class="wb-badge blue">${t('未发送','Not sent')}</span></div><dl class="wb-envelope"><div><dt>${t('收件人','To')}</dt><dd>${r.to}</dd></div><div><dt>${t('草稿编号','Draft ID')}</dt><dd>${r.id}</dd></div></dl><pre>${esc(r.body)}</pre><div class="wb-proof"><strong>${t('演练保存回执','Rehearsal save receipt')}</strong><p>${t('来源：CardBot 模拟器。真实草稿箱、重新登录持久化验证仍待接入后验收。','Source: CardBot simulator. Real draft-box and re-login persistence checks remain to be verified after integration.')}</p></div></article></div>`:`<section class="wb-panel wb-empty"><span class="empty-icon">▤</span><h2>${t('还没有模拟保存的草稿','No simulated saved drafts yet')}</h2><p>${t('先生成回复，人工审核后点击“保存到小满 · 模拟”','Generate a reply, review it, then choose “Save to OKKI · simulation”')}</p><button class="wb-button primary" data-view="drafts">${t('前往草稿审核','Go to draft review')} ↗</button></section>`}`;
  }
  function team() {
    return `${metrics()}<div class="wb-team-layout"><section class="wb-panel"><div class="wb-panel-head"><h2>${t('团队工作进度','Team progress')}</h2><span class="wb-badge">${t('同一批任务','Shared task state')}</span></div>${users.filter(u=>u.id!=='manager').map(u=>{const list=u.id==='sales-01'?state().tasks:[];return `<div class="wb-team-member"><span class="wb-avatar">${u.name.slice(0,1)}</span><div><strong>${u.name}</strong><p>${t(u.zh,u.en)}</p></div><div><strong>${list.filter(x=>x.status==='done').length} / ${list.length}</strong><p>${t('已完成 / 任务','done / tasks')}</p></div></div>${list.map(x=>`<div class="wb-team-task"><strong>${title(x.id)}</strong><span class="wb-badge">${status(x.status)}</span><p>${x.status==='done'?esc(x.evidence):missing(x.id)}</p></div>`).join('')}`;}).join('')}</section><aside class="wb-panel"><div class="wb-panel-head"><h2>${t('需要经理关注','Needs your attention')}</h2></div><div class="wb-next"><span>↗</span><div><strong>${t('报价还缺两个确认','Two confirmations block the quote')}</strong><p>${t('Jojo 等待产品负责人提供新版价格和交期。已有草稿不会自动关闭该任务。','Jojo needs revised pricing and delivery from the product owner. Having a draft does not close the task.')}</p></div></div><div class="wb-note"><p>${t('经理汇总默认展示任务状态和完成依据。正式上线时邮件正文权限需要单独配置。','The manager summary shows task status and evidence. Production mailbox access must be configured separately.')}</p></div></aside></div>`;
  }
  function organization() {
    return `<div class="wb-org-grid"><section class="wb-panel wb-org-primary"><span class="wb-kicker">CARDBOT × OKKI</span><h2>${t('一套企业连接，各自的工作空间','One enterprise connection. Individual workspaces.')}</h2><p>${t('企业统一授权，业务员绑定自己的小满身份。当前用虚构账号演示未来流程。','The company authorizes access; each salesperson maps their OKKI identity. All accounts shown here are fictional.')}</p><span class="wb-badge">${t('模拟连接可用','Simulation available')}</span></section><section class="wb-panel"><div class="wb-panel-head"><h2>${t('连接状态','Connection status')}</h2></div><div class="wb-connection"><strong>${t('演练连接','Rehearsal connector')}</strong><span>${t('本地模拟','Local simulation')}</span></div><div class="wb-connection"><strong>OKKI API</strong><span>${t('等待企业授权','Awaiting company authorization')}</span></div><div class="wb-connection"><strong>DeepSeek</strong><span>${t('未接入 · 预置回复','Not connected · preset replies')}</span></div><div class="wb-connection"><strong>${t('历史邮件','Historical mail')}</strong><span>${t('虚构样本','Fictional samples')}</span></div></section></div><section class="wb-panel wb-identity-table"><div class="wb-panel-head"><h2>${t('成员与身份绑定','Members & identity mapping')}</h2><span class="wb-badge">4 ${t('位成员','members')}</span></div>${users.map((u,i)=>`<div class="wb-identity-row"><span class="wb-avatar">${u.name.slice(0,1)}</span><div><strong>${u.name}</strong><p>${t(u.zh,u.en)}</p></div><div><small>CARDBOT</small><p>${u.id}</p></div><div><small>OKKI USER ID</small><p>DEMO-U-${u.id==='manager'?'9001':u.id==='sales-01'?'2001':u.id==='sales-02'?'2002':'2003'}</p></div><span class="wb-badge">${t('模拟绑定','Mock binding')}</span></div>`).join('')}</section>`;
  }
  function render() {
    releaseArt(); window.clearInterval(clock);
    document.documentElement.lang=locale==='zh'?'zh-CN':'en';
    if(!isManager()&&['team','organization'].includes(view)) view='overview';
    const activeUser=users.find(u=>u.id===actor())!;
    root.innerHTML=`<div class="wb-shell ${menuOpen?'menu-open':''}"><aside class="wb-sidebar"><a class="wordmark" href="/">cardbot<span>®</span></a><div class="wb-company"><span class="wb-avatar">C</span><div><strong>${t('全球贸易演示企业','Global Trade Demo')}</strong><small>${t('企业工作空间','Enterprise workspace')}</small></div></div><span class="wb-kicker nav-section">WORKSPACE</span><nav aria-label="${t('工作台导航','Workspace navigation')}">${navs.filter(n=>isManager()||!['team','organization'].includes(n[0])).map(([id,icon,zh,en])=>`<button class="wb-nav ${view===id?'active':''}" data-view="${id}" ${view===id?'aria-current="page"':''}><span aria-hidden="true">${icon}</span>${t(zh,en)}${id==='outbox'?`<small>${t('模拟','SIM')}</small>`:''}</button>`).join('')}</nav><div class="wb-sidebar-bottom"><div class="wb-connector"><span class="connection-dot"></span><div><strong>${t('演练连接已就绪','Rehearsal ready')}</strong><small>${t('真实小满 API 待授权','Real OKKI API awaits authorization')}</small></div></div>${btn(t('重看品牌开场','Replay brand intro'),'intro')}</div></aside><div class="wb-main"><header class="wb-topbar"><div class="wb-breadcrumb"><button class="wb-menu" data-wb-action="menu" aria-expanded="${menuOpen}" aria-label="${t('打开功能菜单','Open navigation')}">☰</button><span>${t('工作空间','Workspace')}</span><span>/</span><strong>${nameOf(view)}</strong></div><div class="wb-top-actions"><time id="local-time"></time>${btn(locale==='zh'?'EN':'中文','language')}${btn(document.documentElement.dataset.theme==='dark'?t('◐ 浅色','◐ Light'):t('◐ 深色','◐ Dark'),'theme')}<label class="wb-user"><span class="sr-only">${t('切换演示身份','Switch demo identity')}</span><select id="demo-user">${users.map(u=>`<option value="${u.id}" ${actor()===u.id?'selected':''}>${u.name} · ${t(u.zh.split(' · ')[0],u.en.split(' · ')[0])}</option>`).join('')}</select></label></div></header><div class="wb-mode"><span><i></i>${t('交互演示','INTERACTIVE DEMO')}</span><p>${t('虚构业务数据 · 小满模拟接入 · 不发送邮件','Fictional business data · simulated OKKI connection · no emails sent')}</p></div><main class="wb-content" id="operations">${view!=='overview'?`<div class="wb-page-heading"><div><span class="wb-kicker">${step>=0?scenes[step].time:'DEMO-DAY-001'} / ${activeUser.name}</span><h1>${nameOf(view)}</h1></div>${step<0?btn('▷ '+t('播放演练','Play rehearsal'),'tour-start',true):''}</div>${step>=0?playback():''}`:''}<div id="notice" class="wb-notice" role="status" ${notice?'':'hidden'}>${esc(notice)}</div>${view==='overview'?overview():view==='workday'?workday():view==='evidence'?evidence():view==='drafts'?draft():view==='outbox'?outbox():view==='team'?team():organization()}<footer class="wb-footer"><span>${t('事实优先，始终由人把关','Evidence first. Humans always.')}</span>${btn(t('导出演示数据','Export demo data'),'export')}</footer></main></div></div>`;
    const canvas=root.querySelector<HTMLCanvasElement>('#text-earth');
    releaseArt=canvas?mountTextArt(canvas,'earth'):()=>{};
    updateClock(); clock=window.setInterval(updateClock,1000);
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
    const button=(event.target as HTMLElement).closest<HTMLElement>('button'); if(!button || (button as HTMLButtonElement).disabled)return;
    if(button.dataset.step!==undefined){pause();goStep(Number(button.dataset.step));return;}
    if(button.dataset.view){pause();view=button.dataset.view as View;menuOpen=false;notice='';render();return;}
    if(button.dataset.task){pause();selected=button.dataset.task;view='workday';render();return;}
    if(button.dataset.mail){pause();focusMail=button.dataset.mail;render();root.querySelector('#'+focusMail)?.scrollIntoView({block:'nearest'});return;}
    if(button.dataset.filter){pause();filter=button.dataset.filter;render();return;}
    const action=button.dataset.wbAction;if(!action)return;
    notice='';
    if(action.startsWith('tour-')){
      if(action==='tour-start'||action==='tour-restart'){playing=true;goStep(0);}
      if(action==='tour-play'){playing=!playing;render();schedule();}
      if(action==='tour-prev'||action==='tour-next'){pause();goStep(step+(action==='tour-prev'?-1:1));}
      if(action==='tour-exit'){pause();step=-1;view='overview';render();}
      return;
    }
    if(action==='language'){locale=locale==='zh'?'en':'zh';localStorage.setItem('cardbot_locale',locale);render();return;}
    if(action==='theme'){document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('cardbot_theme',document.documentElement.dataset.theme);render();return;}
    if(action==='menu'){menuOpen=!menuOpen;render();return;}
    if(action==='intro'){dispose();onIntro();return;}
    if(action==='export'){const payload={kind:step>=0?'cardbot-rehearsal-snapshot':'cardbot-fictional-preview',...state()};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cardbot-demo.json';a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(step>=0){pause();notice=t('当前是演练回放，退出演练即可手动操作','This is a rehearsal playback. Exit to work manually.');render();return;}
    try {
      if(action==='morning'||action==='evening'){manual.phase=action;}
      else if(!ownsWork()) throw new Error(t('当前身份无此任务权限','This identity cannot access these tasks'));
      else if(action==='generate'){if(manual.draft.status==='empty')createDraft(manual);view='drafts';}
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
  function dispose(){pause();releaseArt();window.clearInterval(clock);root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('input',input);}
  root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('input',input);
  sessionStorage.setItem('cardbot_intro_v2','seen');render();return dispose;
}
