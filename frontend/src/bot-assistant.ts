import './bot-assistant.css';

type Locale = 'zh' | 'en';
type Panel = 'closed' | 'picker' | 'chat' | 'minimized';
type Message = { role: 'assistant' | 'user'; text: string };
type BotConfig = { color: string; expression: string };
type DragPosition = { x: number; y: number };

const COLORS = [
  ['encre','#0a0a0c','墨黑','Ink'], ['brun','#8b5e3c','棕色','Brown'],
  ['rouge','#e8483f','红色','Red'], ['orange','#f08a24','橙色','Orange'],
  ['ambre','#f0b429','琥珀','Amber'], ['vert','#3ecf8e','绿色','Green'],
  ['turquoise','#2fbfa0','青绿','Teal'], ['bleu','#3b93f0','蓝色','Blue'],
  ['violet','#8b5cf6','紫色','Violet'], ['rose','#e152b0','粉色','Pink'],
  ['gris','#a3a3a3','灰色','Grey'], ['creme','#f1efe9','奶油白','Cream']
] as const;

const EXPRESSIONS = [
  ['neutre','平静','Calm'], ['attentif','专注','Focused'], ['surpris','惊讶','Surprised'], ['excite','兴奋','Excited'],
  ['heureux','开心','Happy'], ['hilare','大笑','Laughing'], ['colere','生气','Angry'], ['triste','难过','Sad'],
  ['effraye','害怕','Afraid'], ['mefiant','怀疑','Skeptical'], ['confus','困惑','Confused'], ['curieux','好奇','Curious'],
  ['fier','得意','Proud'], ['timide','羞怯','Shy'], ['blase','无趣','Unamused'], ['somnolent','困倦','Sleepy']
] as const;

const DEFAULT_CONFIG: BotConfig = { color: 'encre', expression: 'neutre' };
const KNOWLEDGE_PROMPTS = {
  zh: [
    ['quote','报价流程怎么走？'], ['mail','客户邮件回复要注意什么？'], ['sample','公司的样品政策是什么？'],
    ['discount','折扣需要谁审批？'], ['payment','客户可以选择哪些付款方式？'], ['delivery','交期如何对客户承诺？'],
    ['certificate','产品认证资料在哪里？'], ['privacy','客户资料如何保管？']
  ],
  en: [
    ['quote','What is our quotation process?'], ['mail','What should I check before replying?'], ['sample','What is our sample policy?'],
    ['discount','Who approves a discount?'], ['payment','Which payment terms can we offer?'], ['delivery','How should I confirm delivery?'],
    ['certificate','Where are product certificates?'], ['privacy','How should customer data be handled?']
  ]
} as const;
const colorIds: Set<string> = new Set(COLORS.map(item => item[0]));
const expressionIds: Set<string> = new Set(EXPRESSIONS.map(item => item[0]));
const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));

function validConfig(value: unknown): BotConfig | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<BotConfig>;
  return colorIds.has(String(candidate.color)) && expressionIds.has(String(candidate.expression))
    ? { color: candidate.color!, expression: candidate.expression! } : null;
}

function face(config: BotConfig, size = '', alive = false) {
  const color = COLORS.find(item => item[0] === config.color) || COLORS[0];
  const eye = color[0] === 'creme' ? '#171819' : '#ffffff';
  return `<span class="cb-bot-face ${size} ${alive ? 'is-alive' : ''}" data-expression="${config.expression}" style="--bot-color:${color[1]};--bot-eye:${eye}" aria-hidden="true"><span class="cb-bot-eyes"><i class="cb-eye-slot left"><b></b></i><i class="cb-eye-slot right"><b></b></i></span></span>`;
}

function accentStyle(config: BotConfig) {
  const color = COLORS.find(item => item[0] === config.color) || COLORS[0];
  const darkText = new Set(['ambre','vert','turquoise','creme']);
  return `--bot-accent:${color[1]};--bot-accent-text:${darkText.has(color[0]) ? '#171819' : '#ffffff'}`;
}

function replyFor(question: string, locale: Locale) {
  const lower = question.toLowerCase();
  if (/报价|quote|price/.test(lower)) return locale === 'zh'
    ? '报价按四步执行：\n1. 核对客户、型号、数量与贸易条款\n2. 向产品负责人确认最新价格与有效期\n3. 向供应链确认交期与运输方式\n4. 生成草稿后，由业务员复核收件人、币种和承诺内容再发送\n\n未经确认的价格和交期不能写入正式报价。'
    : 'Use four checks before quoting:\n1. Confirm the customer, model, quantity and Incoterms\n2. Verify current pricing and validity with the product owner\n3. Confirm lead time and shipping method with supply chain\n4. Have the salesperson review the recipient, currency and commitments before sending\n\nNever include unconfirmed pricing or delivery dates in a formal quotation.';
  if (/邮件|mail|email|回复/.test(lower)) return locale === 'zh'
    ? '回复客户邮件前，请核对五项：收件人与抄送人、客户原始诉求、产品型号和数量、尚未确认的业务承诺、附件版本。CardBot 可以根据历史邮件整理草稿，但最终发送必须由业务员确认。'
    : 'Before replying, verify five items: recipients and CCs, the customer’s original request, model and quantity, any unconfirmed commitments, and attachment versions. CardBot can prepare a draft from the email history, but the salesperson must approve the final send.';
  if (/样品|sample|寄送/.test(lower)) return locale === 'zh'
    ? '样品政策：常规样品每位客户每次最多 2 件；标准样品可由业务主管审批，定制样品需产品负责人确认成本。寄送前必须取得客户确认的完整地址、联系人、电话和期望日期。样品费与运费是否减免，以审批记录为准。'
    : 'Sample policy: up to two standard samples per customer per request. A sales lead may approve standard samples; customized samples require the product owner to confirm cost. Before shipping, obtain the customer-confirmed full address, contact, phone number and requested date. Any sample or freight waiver must have an approval record.';
  if (/折扣|discount|优惠/.test(lower)) return locale === 'zh'
    ? '折扣权限：标准价以内由业务员报价；5% 以内由销售经理审批；超过 5% 需销售负责人和财务共同确认。所有折扣必须在报价草稿中保留审批编号。'
    : 'Discount authority: salespeople may quote the standard price; discounts up to 5% require sales-manager approval; anything above 5% requires both the sales director and finance. Keep the approval reference in the quotation draft.';
  if (/付款|payment|账期|信用证|电汇/.test(lower)) return locale === 'zh'
    ? '可选付款方式包括 T/T 电汇和经财务批准的信用证。新客户默认 30% 预付款、70% 发货前付清；任何账期或比例调整都需要财务审批，业务员不能自行承诺。'
    : 'Available payment methods include T/T and letters of credit approved by finance. New customers default to 30% deposit and 70% before shipment. Any credit term or ratio change requires finance approval and cannot be promised by a salesperson alone.';
  if (/交期|delivery|lead time|发货/.test(lower)) return locale === 'zh'
    ? '对外承诺交期前，需要供应链提供带日期的确认记录。报价中应区分生产周期与运输时间，并注明交期从预付款和订单确认完成后开始计算。没有确认记录时，只能写“待确认”。'
    : 'Before promising delivery, obtain a dated confirmation from supply chain. Separate production lead time from transit time, and state that lead time starts after deposit and order confirmation. Without a confirmation record, mark delivery as “to be confirmed”.';
  if (/认证|证书|certificate|certification|报告/.test(lower)) return locale === 'zh'
    ? '产品认证资料按“产品型号 / 市场 / 有效期”归档。发送前请确认型号一致、证书仍在有效期内，并优先使用质量团队标记为“对外可用”的版本。内部检测记录不得直接发送给客户。'
    : 'Product certificates are filed by model, market and validity period. Before sharing, confirm the model matches, the certificate is current, and the quality team has marked the version “approved for external use”. Internal test records must not be sent directly.';
  if (/客户资料|隐私|保管|privacy|customer data|personal data/.test(lower)) return locale === 'zh'
    ? '客户资料只保存在企业授权的 CRM 与文件库中，并按账号权限访问。不要把联系人信息复制到个人网盘或私人聊天工具；导出、转交和删除都应留下操作记录。'
    : 'Store customer data only in company-approved CRM and file systems, with account-based access. Do not copy contact details to personal drives or private chat tools. Exports, transfers and deletion should leave an audit record.';
  return locale === 'zh'
    ? '我可以回答报价、邮件、样品、折扣、付款、交期、认证资料和客户数据规范。你也可以直接描述正在处理的业务问题，我会按企业规则整理下一步。'
    : 'I can answer questions about quotations, email, samples, discounts, payment, delivery, certificates and customer-data rules. You can also describe the case you are handling and I will organize the next steps using company policy.';
}

export type BotAssistant = {
  mount(context: { locale: Locale; accountId: string; accountName: string }): void;
  destroy(): void;
};

export function createBotAssistant(root: HTMLElement): BotAssistant {
  let locale: Locale = 'zh';
  let accountId = '';
  let accountName = '';
  let panel: Panel = 'closed';
  let configured = false;
  let config: BotConfig = { ...DEFAULT_CONFIG };
  let savedConfig: BotConfig = { ...DEFAULT_CONFIG };
  let messages: Message[] = [];
  let thinking = false;
  let thinkingTimer = 0;
  let dragPosition: DragPosition | null = null;
  let drag: { pointerId: number; offsetX: number; offsetY: number; startX: number; startY: number; moved: boolean; element: HTMLElement } | null = null;
  let suppressClick = false;
  const t = (zh: string, en: string) => locale === 'zh' ? zh : en;
  const storageKey = () => `cardbot_bot_v1_${accountId}`;

  function loadAccount() {
    let stored: BotConfig | null = null;
    try { stored = validConfig(JSON.parse(localStorage.getItem(storageKey()) || 'null')); } catch { /* Use default. */ }
    configured = Boolean(stored);
    config = stored || { ...DEFAULT_CONFIG };
    savedConfig = { ...config };
    messages = [];
    thinking = false;
    window.clearTimeout(thinkingTimer);
    panel = 'closed';
    dragPosition = null;
  }

  function greeting() {
    if (messages.length) return;
    messages.push({ role: 'assistant', text: t(
      `你好，${accountName}。需要帮你做什么？我可以查询报价流程、邮件规范、样品政策和其他企业规则。`,
      `Hi ${accountName}. What can I help with? I can answer questions about quotations, email, samples and other company policies.`
    ) });
  }

  function picker() {
    return `<section class="cb-bot-popover cb-bot-picker" style="${accentStyle(config)}" role="dialog" aria-modal="false" aria-labelledby="bot-picker-title" data-testid="bot-picker">
      <header data-bot-drag-handle><div><span class="cb-bot-kicker">PERSONAL CARDBOT</span><h2 id="bot-picker-title">${t('选择你的 Bot','Choose your Bot')}</h2></div><button data-bot-action="picker-close" aria-label="${t('关闭选择器','Close picker')}">×</button></header>
      <div class="cb-picker-preview">${face(config, 'large', true)}<div><strong>${accountName} ${t('的工作搭档','’s work companion')}</strong><p>${t('扑克牌外形固定；选择你喜欢的表情和颜色','The card shape stays fixed. Pick an expression and colour.')}</p></div></div>
      <div class="cb-picker-section"><h3>${t('表情','Expression')}</h3><div class="cb-expression-grid">${EXPRESSIONS.map(item => `<button class="cb-expression ${config.expression===item[0]?'selected':''}" data-bot-action="expression" data-value="${item[0]}" aria-pressed="${config.expression===item[0]}">${face({ ...config, expression:item[0] }, 'tiny')}<span>${t(item[1],item[2])}</span></button>`).join('')}</div></div>
      <div class="cb-picker-section"><h3>${t('颜色','Colour')}</h3><div class="cb-color-grid">${COLORS.map(item => `<button class="cb-color ${config.color===item[0]?'selected':''}" style="--swatch:${item[1]}" data-bot-action="color" data-value="${item[0]}" aria-label="${t(item[2],item[3])}" aria-pressed="${config.color===item[0]}"><i></i></button>`).join('')}</div></div>
      <footer><span>${t('每个演示账号单独保存','Saved separately for each demo account')}</span><button class="cb-bot-primary" data-bot-action="picker-save">${t('选好了','Use this Bot')} ↗</button></footer>
    </section>`;
  }

  function chat() {
    if (panel === 'minimized') return `<section class="cb-bot-popover cb-bot-minimized" style="${accentStyle(config)}" data-testid="bot-chat-minimized" data-bot-drag-handle>${face(config,'mini',true)}<button data-bot-action="expand" aria-label="${t('展开 CardBot','Expand CardBot')}"><strong>CardBot</strong></button><button data-bot-action="close" aria-label="${t('关闭','Close')}">×</button></section>`;
    greeting();
    const suggestions = KNOWLEDGE_PROMPTS[locale];
    return `<section class="cb-bot-popover cb-bot-chat" style="${accentStyle(config)}" role="dialog" aria-modal="false" aria-labelledby="bot-chat-title" data-testid="bot-chat">
      <header data-bot-drag-handle>${face(config,'mini',true)}<div><span class="cb-bot-kicker">COMPANY KNOWLEDGE</span><h2 id="bot-chat-title">CardBot</h2></div><div class="cb-chat-controls"><button class="cb-customize" data-bot-action="customize">${t('定制','Customize')}</button><button data-bot-action="minimize" aria-label="${t('最小化','Minimize')}">−</button><button data-bot-action="close" aria-label="${t('收回','Close')}">×</button></div></header>
      <div class="cb-chat-status"><i></i>${t('企业知识已就绪 · 回答范围受控','Company knowledge ready · governed answers')}</div>
      <div class="cb-chat-messages" aria-live="polite">${messages.map(message => `<p class="${message.role}"><span>${message.role==='assistant'?'BOT':accountName}</span>${escapeHtml(message.text)}</p>`).join('')}${thinking?`<div class="cb-thinking" role="status"><span>BOT</span><b>${t('正在思考','Thinking')}</b><i></i><i></i><i></i></div>`:''}</div>
      <div class="cb-chat-suggestions" aria-label="${t('常用企业问题，可横向滚动','Common company questions; scroll horizontally')}">${suggestions.map(item => `<button data-bot-action="suggest" data-prompt="${item[0]}" ${thinking?'disabled':''}>${item[1]}</button>`).join('')}</div>
      <form class="cb-chat-form"><label class="sr-only" for="bot-question">${t('向 CardBot 提问','Ask CardBot')}</label><input id="bot-question" name="question" autocomplete="off" placeholder="${t('需要帮你做什么？','What can I help with?')}" maxlength="240" ${thinking?'disabled':''}><button class="cb-bot-primary" data-bot-action="submit" aria-label="${t('发送问题','Send question')}" ${thinking?'disabled':''}>↑</button></form>
      <footer>${t('基于企业资料回答 · 执行前请人工核对','Based on company material · verify before action')}</footer>
    </section>`;
  }

  function render() {
    const slot = root.querySelector<HTMLElement>('[data-bot-slot]');
    root.querySelector('.cb-bot-popover')?.remove();
    if (!slot) return;
    slot.innerHTML = `<button class="cb-brand-bot ${configured?'':'needs-setup'}" data-bot-action="open" data-testid="brand-bot" data-configured="${configured}" aria-label="${configured?t('打开 CardBot 助手','Open CardBot assistant'):t('选择你的 CardBot','Choose your CardBot')}" title="${configured?t('打开知识助手','Open knowledge assistant'):t('选择你的 Bot','Choose your Bot')}">${face(config,'brand',true)}</button>`;
    if (panel === 'picker') root.insertAdjacentHTML('beforeend', picker());
    if (panel === 'chat' || panel === 'minimized') root.insertAdjacentHTML('beforeend', chat());
    const popover = root.querySelector<HTMLElement>('.cb-bot-popover');
    if (popover && dragPosition && (window.innerWidth > 700 || panel === 'minimized')) {
      popover.style.left = `${dragPosition.x}px`; popover.style.top = `${dragPosition.y}px`;
      popover.style.right = 'auto'; popover.style.bottom = 'auto';
    }
    const stream = root.querySelector<HTMLElement>('.cb-chat-messages');
    if (stream) requestAnimationFrame(() => { stream.scrollTop = stream.scrollHeight; });
  }

  function ask(question: string) {
    const value = question.trim(); if (!value || thinking) return;
    messages.push({ role:'user', text:value });
    thinking = true; panel = 'chat'; render();
    window.clearTimeout(thinkingTimer);
    thinkingTimer = window.setTimeout(() => {
      messages.push({ role:'assistant', text:replyFor(value,locale) });
      thinking = false; render();
    }, 900);
  }

  function click(event: Event) {
    if (suppressClick) { suppressClick=false; event.preventDefault(); return; }
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-bot-action]');
    if (!button) return;
    const action = button.dataset.botAction;
    if (action === 'open') panel = configured ? 'chat' : 'picker';
    if (action === 'close') panel = 'closed';
    if (action === 'minimize') panel = 'minimized';
    if (action === 'expand') panel = 'chat';
    if (action === 'customize') { savedConfig={...config}; panel='picker'; }
    if (action === 'picker-close') { config={...savedConfig}; panel='closed'; }
    if (action === 'expression' && expressionIds.has(String(button.dataset.value))) config.expression=button.dataset.value!;
    if (action === 'color' && colorIds.has(String(button.dataset.value))) config.color=button.dataset.value!;
    if (action === 'picker-save') {
      try { localStorage.setItem(storageKey(), JSON.stringify(config)); } catch { /* Preview remains usable. */ }
      configured=true; savedConfig={...config}; messages=[]; panel='chat';
    }
    if (action === 'suggest') {
      const prompts = Object.fromEntries(KNOWLEDGE_PROMPTS[locale]) as Record<string,string>;
      ask(prompts[button.dataset.prompt || ''] || ''); return;
    }
    if (action !== 'submit') render();
  }

  function submit(event: Event) {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>('.cb-chat-form');
    if (!form) return; event.preventDefault();
    ask(new FormData(form).get('question')?.toString() || '');
  }

  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && panel !== 'closed') { panel='closed'; render(); }
  }

  function pointerdown(event: PointerEvent) {
    if ((window.innerWidth <= 700 && panel !== 'minimized') || event.button !== 0) return;
    const target = event.target as HTMLElement;
    const handle = target.closest<HTMLElement>('[data-bot-drag-handle]');
    if (!handle || target.closest('input')) return;
    const actionButton = target.closest<HTMLButtonElement>('[data-bot-action]');
    if (actionButton && !(panel === 'minimized' && actionButton.dataset.botAction === 'expand')) return;
    const element = handle.closest<HTMLElement>('.cb-bot-popover'); if (!element) return;
    const rect = element.getBoundingClientRect();
    drag = { pointerId:event.pointerId, offsetX:event.clientX-rect.left, offsetY:event.clientY-rect.top, startX:event.clientX, startY:event.clientY, moved:false, element };
    element.classList.add('is-dragging');
  }

  function pointermove(event: PointerEvent) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY) < 4) return;
    drag.moved=true;
    event.preventDefault();
    const rect = drag.element.getBoundingClientRect();
    const x = Math.max(8,Math.min(window.innerWidth-rect.width-8,event.clientX-drag.offsetX));
    const y = Math.max(8,Math.min(window.innerHeight-rect.height-8,event.clientY-drag.offsetY));
    dragPosition={x,y}; drag.element.style.left=`${x}px`; drag.element.style.top=`${y}px`;
    drag.element.style.right='auto'; drag.element.style.bottom='auto';
  }

  function pointerup(event: PointerEvent) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClick=drag.moved;
    if (suppressClick) window.setTimeout(()=>{suppressClick=false;},0);
    drag.element.classList.remove('is-dragging'); drag=null;
  }

  root.addEventListener('click',click);
  root.addEventListener('submit',submit);
  root.addEventListener('pointerdown',pointerdown);
  document.addEventListener('pointermove',pointermove);
  document.addEventListener('pointerup',pointerup);
  document.addEventListener('keydown',keydown);
  return {
    mount(context) {
      locale=context.locale; accountName=context.accountName;
      if (accountId !== context.accountId) { accountId=context.accountId; loadAccount(); }
      render();
    },
    destroy() {
      window.clearTimeout(thinkingTimer);
      root.removeEventListener('click',click); root.removeEventListener('submit',submit);
      root.removeEventListener('pointerdown',pointerdown); document.removeEventListener('pointermove',pointermove);
      document.removeEventListener('pointerup',pointerup); document.removeEventListener('keydown',keydown);
      root.querySelector('.cb-bot-popover')?.remove();
    }
  };
}
