import './bot-assistant.css';

type Locale = 'zh' | 'en';
type Panel = 'closed' | 'picker' | 'chat' | 'minimized';
type Message = { role: 'assistant' | 'user'; text: string };
type BotConfig = { color: string; expression: string };

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

function replyFor(question: string, locale: Locale) {
  const lower = question.toLowerCase();
  if (/报价|quote|price/.test(lower)) return locale === 'zh'
    ? '这是演示回答：先核对客户型号与数量，再确认新版价格和交期；没有确认的内容不能写进报价。'
    : 'Demo answer: verify product and quantity first, then confirm current pricing and delivery. Unconfirmed details must stay out of the quotation.';
  if (/邮件|mail|email|回复/.test(lower)) return locale === 'zh'
    ? '这是演示回答：先引用历史邮件中的事实，再生成草稿；收件人、承诺和附件必须由业务员人工复核。'
    : 'Demo answer: ground the draft in email history, then have the salesperson verify recipients, commitments and attachments.';
  if (/样品|sample|寄送/.test(lower)) return locale === 'zh'
    ? '这是演示回答：寄样前需要客户确认完整地址、联系人、电话和期限，不根据城市名称猜测详细地址。'
    : 'Demo answer: before sending a sample, confirm the full address, contact, phone and deadline. Never infer a street address from a city.';
  return locale === 'zh'
    ? '这是知识助手演示。正式版只会检索企业批准的知识库，并显示来源；当前没有接入模型，也不会把这段对话发送出去。'
    : 'This is a knowledge-assistant demo. The real version will search only approved company knowledge and show sources. No model is connected and this chat is not sent anywhere.';
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
  const t = (zh: string, en: string) => locale === 'zh' ? zh : en;
  const storageKey = () => `cardbot_bot_v1_${accountId}`;

  function loadAccount() {
    let stored: BotConfig | null = null;
    try { stored = validConfig(JSON.parse(localStorage.getItem(storageKey()) || 'null')); } catch { /* Use default. */ }
    configured = Boolean(stored);
    config = stored || { ...DEFAULT_CONFIG };
    savedConfig = { ...config };
    messages = [];
    panel = 'closed';
  }

  function greeting() {
    if (messages.length) return;
    messages.push({ role: 'assistant', text: t(
      `你好，${accountName}。需要帮你做什么？我可以演示查询报价流程、邮件规范和样品政策。`,
      `Hi ${accountName}. What can I help with? I can demo answers about quotations, email rules and sample policy.`
    ) });
  }

  function picker() {
    return `<section class="cb-bot-popover cb-bot-picker" role="dialog" aria-modal="false" aria-labelledby="bot-picker-title" data-testid="bot-picker">
      <header><div><span class="cb-bot-kicker">PERSONAL CARDBOT</span><h2 id="bot-picker-title">${t('选择你的 Bot','Choose your Bot')}</h2></div><button data-bot-action="picker-close" aria-label="${t('关闭选择器','Close picker')}">×</button></header>
      <div class="cb-picker-preview">${face(config, 'large', true)}<div><strong>${accountName} ${t('的工作搭档','’s work companion')}</strong><p>${t('扑克牌外形固定；选择你喜欢的表情和颜色','The card shape stays fixed. Pick an expression and colour.')}</p></div></div>
      <div class="cb-picker-section"><h3>${t('表情','Expression')}</h3><div class="cb-expression-grid">${EXPRESSIONS.map(item => `<button class="cb-expression ${config.expression===item[0]?'selected':''}" data-bot-action="expression" data-value="${item[0]}" aria-pressed="${config.expression===item[0]}">${face({ ...config, expression:item[0] }, 'tiny')}<span>${t(item[1],item[2])}</span></button>`).join('')}</div></div>
      <div class="cb-picker-section"><h3>${t('颜色','Colour')}</h3><div class="cb-color-grid">${COLORS.map(item => `<button class="cb-color ${config.color===item[0]?'selected':''}" style="--swatch:${item[1]}" data-bot-action="color" data-value="${item[0]}" aria-label="${t(item[2],item[3])}" aria-pressed="${config.color===item[0]}"><i></i></button>`).join('')}</div></div>
      <footer><span>${t('每个演示账号单独保存','Saved separately for each demo account')}</span><button class="cb-bot-primary" data-bot-action="picker-save">${t('选好了','Use this Bot')} ↗</button></footer>
    </section>`;
  }

  function chat() {
    if (panel === 'minimized') return `<section class="cb-bot-popover cb-bot-minimized" data-testid="bot-chat-minimized">${face(config,'mini',true)}<button data-bot-action="expand"><strong>CardBot</strong><span>${t('知识助手演示','Knowledge assistant demo')}</span></button><button data-bot-action="close" aria-label="${t('关闭','Close')}">×</button></section>`;
    greeting();
    const suggestions = locale === 'zh'
      ? [['quote','报价流程怎么走？'],['mail','客户邮件回复要注意什么？'],['sample','公司的样品政策是什么？']]
      : [['quote','What is our quotation process?'],['mail','What should I check before replying?'],['sample','What is our sample policy?']];
    return `<section class="cb-bot-popover cb-bot-chat" role="dialog" aria-modal="false" aria-labelledby="bot-chat-title" data-testid="bot-chat">
      <header>${face(config,'mini',true)}<div><span class="cb-bot-kicker">COMPANY KNOWLEDGE · DEMO</span><h2 id="bot-chat-title">CardBot</h2></div><div class="cb-chat-controls"><button data-bot-action="customize" aria-label="${t('更换 Bot','Customize Bot')}">◇</button><button data-bot-action="minimize" aria-label="${t('最小化','Minimize')}">−</button><button data-bot-action="close" aria-label="${t('收回','Close')}">×</button></div></header>
      <div class="cb-chat-status"><i></i>${t('演示模式 · 未连接真实知识库','Demo mode · no real knowledge base connected')}</div>
      <div class="cb-chat-messages" aria-live="polite">${messages.map(message => `<p class="${message.role}"><span>${message.role==='assistant'?'BOT':accountName}</span>${escapeHtml(message.text)}</p>`).join('')}</div>
      <div class="cb-chat-suggestions">${suggestions.map(item => `<button data-bot-action="suggest" data-prompt="${item[0]}">${item[1]}</button>`).join('')}</div>
      <form class="cb-chat-form"><label class="sr-only" for="bot-question">${t('向 CardBot 提问','Ask CardBot')}</label><input id="bot-question" name="question" autocomplete="off" placeholder="${t('需要帮你做什么？','What can I help with?')}" maxlength="240"><button class="cb-bot-primary" data-bot-action="submit" aria-label="${t('发送演示问题','Send demo question')}">↑</button></form>
      <footer>${t('固定演示回答 · 不上传、不调用模型','Preset demo answers · no upload or model call')}</footer>
    </section>`;
  }

  function render() {
    const slot = root.querySelector<HTMLElement>('[data-bot-slot]');
    root.querySelector('.cb-bot-popover')?.remove();
    if (!slot) return;
    slot.innerHTML = `<button class="cb-brand-bot ${configured?'':'needs-setup'}" data-bot-action="open" data-testid="brand-bot" data-configured="${configured}" aria-label="${configured?t('打开 CardBot 助手','Open CardBot assistant'):t('选择你的 CardBot','Choose your CardBot')}" title="${configured?t('打开知识助手','Open knowledge assistant'):t('选择你的 Bot','Choose your Bot')}">${face(config,'brand',true)}</button>`;
    if (panel === 'picker') root.insertAdjacentHTML('beforeend', picker());
    if (panel === 'chat' || panel === 'minimized') root.insertAdjacentHTML('beforeend', chat());
  }

  function ask(question: string) {
    const value = question.trim(); if (!value) return;
    messages.push({ role:'user', text:value }, { role:'assistant', text:replyFor(value,locale) });
    panel = 'chat'; render();
  }

  function click(event: Event) {
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
      const prompts: Record<string,string> = locale === 'zh'
        ? {quote:'报价流程怎么走？',mail:'客户邮件回复要注意什么？',sample:'公司的样品政策是什么？'}
        : {quote:'What is our quotation process?',mail:'What should I check before replying?',sample:'What is our sample policy?'};
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

  root.addEventListener('click',click);
  root.addEventListener('submit',submit);
  document.addEventListener('keydown',keydown);
  return {
    mount(context) {
      locale=context.locale; accountName=context.accountName;
      if (accountId !== context.accountId) { accountId=context.accountId; loadAccount(); }
      render();
    },
    destroy() {
      root.removeEventListener('click',click); root.removeEventListener('submit',submit);
      document.removeEventListener('keydown',keydown); root.querySelector('.cb-bot-popover')?.remove();
    }
  };
}
