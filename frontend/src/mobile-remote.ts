type Locale = 'zh' | 'en';
export type RemoteState = 'waiting' | 'refreshed' | 'copied' | 'stopped' | 'channels';
export const REMOTE_PRESENTATION_PAGE_COUNT = 6;

export function remoteDeviceIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="12" height="9" rx="1.8"></rect><path d="M7.5 17.5h4M9.5 13.5v4"></path><rect x="14.5" y="10.5" width="6" height="9" rx="1.5"></rect><path d="M16.8 17.2h1.4"></path></svg>`;
}

function channelLogo(channel: 'wechat' | 'lark' | 'whatsapp') {
  if (channel === 'wechat') return `<span class="wb-channel-logo wechat" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="#07C160" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/></svg></span>`;
  if (channel === 'whatsapp') return `<span class="wb-channel-logo whatsapp" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></span>`;
  return `<span class="wb-channel-logo lark" aria-hidden="true"><svg viewBox="0 0 48 48"><path fill="#3370FF" d="M7 8c8 9 13 14 25 19-7 2-13 6-18 13-2-13-4-20-7-32Z"/><path fill="#00D6B9" d="M15 7c10 3 17 3 27 0-3 8-8 13-15 17-2-7-6-12-12-17Z"/><path fill="#34C8FF" d="M25 24c7-4 12-9 17-17 0 13-3 23-10 31-1-6-3-10-7-14Z"/><path fill="#7B61FF" d="M14 40c5-7 11-11 18-13-2 6-1 10 0 11-6 3-12 4-18 2Z"/></svg></span>`;
}

function qrPreview(seed: number) {
  const modules: string[] = [];
  const insideFinder = (x: number,y: number) => (x<7&&y<7)||(x>21&&y<7)||(x<7&&y>21);
  for (let y=0;y<29;y+=1) for (let x=0;x<29;x+=1) {
    if (insideFinder(x,y)) continue;
    if (((x*11+y*7+x*y+seed*13)%17)<7) modules.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  }
  const finder = (x: number,y: number) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x+1}" y="${y+1}" width="5" height="5" fill="#fff"/><rect x="${x+2}" y="${y+2}" width="3" height="3"/>`;
  return `<svg class="wb-remote-qr" viewBox="-2 -2 33 33" role="img" aria-label="Preview QR code"><rect x="-2" y="-2" width="33" height="33" rx="1" fill="#fff"/>${finder(0,0)}${finder(22,0)}${finder(0,22)}${modules.join('')}</svg>`;
}

function remoteConnectPage(t: (zh: string,en: string) => string, state: RemoteState, seed: number, status: string) {
  const sharedCapability = t('找客户、跟客户、查知识、审草稿','Prospect, follow up, search knowledge, review drafts');
  return `<div class="wb-remote-grid" data-testid="remote-connect-page">
    <section class="wb-remote-connect"><div class="wb-remote-section-title"><span>▯</span><div><h3>${t('手机扫码连接','Connect by phone')}</h3><p>${t('扫码后，在手机上进入自己的工作区','Scan to open your own workspace on mobile')}</p></div></div>
      <div class="wb-remote-status"><div><strong>${status}</strong><span class="${state==='stopped'?'stopped':''}"></span></div><p>${t('正式上线时，由企业授权连接所选渠道。','At launch, the company authorizes the selected channels.')}</p><div class="wb-remote-tools"><button data-wb-action="remote-refresh">↻ ${t('刷新二维码','Refresh QR')}</button><button data-wb-action="remote-copy">▢ ${t('复制链接','Copy link')}</button><button data-wb-action="remote-stop">⌁ ${t('停止','Stop')}</button></div></div>
      <div class="wb-remote-qr-wrap">${qrPreview(seed)}</div>
    </section>
    <section class="wb-remote-channels"><div class="wb-remote-section-title"><span>♙</span><div><h3>${t('企业选择常用渠道','Choose company channels')}</h3><p>${t('接哪个都可以，功能完全一样','Choose any channel; the capabilities stay the same')}</p></div></div>
      <div class="wb-channel-list">
        <article>${channelLogo('wechat')}<div class="wb-channel-copy"><div class="wb-channel-line"><h4>${t('微信','WeChat')}</h4><p>${sharedCapability}</p></div><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
        <article>${channelLogo('lark')}<div class="wb-channel-copy"><div class="wb-channel-line"><h4>${t('飞书','Lark')}</h4><p>${sharedCapability}</p></div><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
        <article>${channelLogo('whatsapp')}<div class="wb-channel-copy"><div class="wb-channel-line"><h4>WhatsApp</h4><p>${sharedCapability}</p></div><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
      </div><button class="wb-bot-manager" data-wb-action="remote-channel">♙ ${t('机器人管理','Bot management')}</button>
    </section>
  </div>`;
}

function capabilityPage(t: (zh: string,en: string) => string, page: number) {
  if (page === 1) return `<section class="wb-capability-slide" data-testid="unified-entry-slide">
    <div class="wb-slide-intro"><span class="wb-slide-kicker">ONE ENTRY / 01</span><h3>${t('接哪个渠道，功能都一样','Any channel. The same CardBot.')}</h3><p>${t('微信、飞书、WhatsApp 只是入口，背后使用同一套规则和能力。','WeChat, Lark and WhatsApp are simply entry points to the same rules and capabilities.')}</p></div>
    <div class="wb-channel-bridge"><div class="wb-channel-nodes"><div>${channelLogo('wechat')}<b>${t('微信','WeChat')}</b></div><div>${channelLogo('lark')}<b>${t('飞书','Lark')}</b></div><div>${channelLogo('whatsapp')}<b>WhatsApp</b></div></div><div class="wb-bridge-line"></div><div class="wb-core-node"><span>CardBot</span><strong>${t('同一套业务流程','One business workflow')}</strong><small>DEEPSEEK · KNOWLEDGE · RULES</small></div></div>
    <div class="wb-capability-rail four"><div><span>01</span><strong>${t('开发客户','Find customers')}</strong></div><div><span>02</span><strong>${t('跟进客户','Follow up')}</strong></div><div><span>03</span><strong>${t('查询知识','Search knowledge')}</strong></div><div><span>04</span><strong>${t('审核草稿','Review drafts')}</strong></div></div>
    <div class="wb-slide-thesis"><span>${t('重点','THE POINT')}</span><strong>${t('企业只需选择愿意接入的渠道，不需要重复建设功能。','Choose the channels you need without rebuilding the product for each one.')}</strong></div>
  </section>`;

  if (page === 2) return `<section class="wb-capability-slide" data-testid="prospecting-solution-slide">
    <div class="wb-slide-intro"><span class="wb-slide-kicker">FIND CUSTOMERS / 02</span><h3>${t('帮业务员找到值得联系的新客户','Help sales find prospects worth contacting')}</h3><p>${t('从目标企业开始，找到并核实联系人；AI 准备内容，人确认后再联系。','Start with target companies, verify contacts, then let AI prepare outreach for human approval.')}</p></div>
    <div class="wb-decision-pipeline">
      <article><span>01 / TARGET</span><b>${t('找目标企业','Find target companies')}</b><small>${t('按国家、行业和产品筛选','Filter by market, industry and product')}</small></article><i>→</i>
      <article><span>02 / VERIFY</span><b>${t('核实联系人','Verify contacts')}</b><small>${t('确认姓名、职位和联系方式','Confirm identity, role and contact details')}</small></article><i>→</i>
      <article><span>03 / DRAFT</span><b>${t('AI 准备触达内容','AI prepares outreach')}</b><small>${t('结合产品和客户信息来写','Tailored to the product and prospect')}</small></article><i>→</i>
      <article class="emphasis"><span>04 / HUMAN</span><b>${t('人确认后联系','Human approves contact')}</b><small>${t('不自动群发，不跳过审核','No blind mass sending or skipped review')}</small></article>
    </div>
    <div class="wb-flow-summary compact"><span>${t('解决','SOLVES')}</span><strong>${t('客户从哪里来，以及该先联系谁。','Where new customers come from—and who to contact first.')}</strong></div>
  </section>`;

  if (page === 3) return `<section class="wb-capability-slide" data-testid="followup-solution-slide">
    <div class="wb-slide-intro"><span class="wb-slide-kicker">FOLLOW UP / 03</span><h3>${t('客户发来消息，CardBot 帮你接着做','A customer replies. CardBot keeps the work moving.')}</h3><p>${t('先看以前谈过什么，再判断下一步；AI 写草稿，人确认后再发。','Review the history, decide the next step, and draft a reply for human approval.')}</p></div>
    <div class="wb-plain-flow" aria-label="${t('客户跟进流程','Customer follow-up workflow')}">${[
      [t('客户发来消息','Message arrives'),t('从任一渠道进入','From any connected channel')],
      [t('先看历史','Review history'),t('以前谈过什么','See what was discussed')],
      [t('判断下一步','Decide next step'),t('现在应该做什么','Know what to do now')],
      [t('AI 写草稿','AI drafts'),t('人确认后再发','Human approves before sending')],
      [t('全程留痕','Keep a record'),t('过程和责任都可查','Trace actions and ownership')]
    ].map(([title,note],index)=>`${index?'<i>→</i>':''}<div><span>${String(index+1).padStart(2,'0')}</span><strong>${title}</strong><small>${note}</small></div>`).join('')}</div>
    <div class="wb-flow-summary compact"><span>${t('解决','SOLVES')}</span><strong>${t('邮件太多容易漏，以及不知道下一步做什么。','Too many messages, missed follow-ups and unclear next actions.')}</strong></div>
  </section>`;

  if (page === 4) return `<section class="wb-capability-slide" data-testid="controlled-ai-slide">
    <div class="wb-slide-intro"><span class="wb-slide-kicker">SAFE & CONTROLLED / 04</span><h3>${t('每个人独立，AI 不会乱聊','Individual workspaces. AI stays on task.')}</h3><p>${t('业务员只看自己的客户和任务；AI 只查授权知识、执行允许的功能。','Each salesperson sees only their own customers and tasks; AI uses authorized knowledge and allowed actions only.')}</p></div>
    <div class="wb-audit-layout"><div class="wb-audit-log">
      <div><time>ACCOUNT</time><span class="ok"></span><b>${t('每人独立登录','Individual sign-in')}</b><small>${t('只看自己的客户和任务','Own customers and tasks only')}</small></div>
      <div><time>ACCESS</time><span class="ok"></span><b>${t('按权限查公司资料','Permission-based knowledge')}</b><small>${t('看不到未授权内容','No unauthorized sources')}</small></div>
      <div><time>LIMIT</time><span class="human"></span><b>${t('超出范围就拒绝或转人工','Refuse or hand off')}</b><small>${t('不做无限制闲聊','No unrestricted chatbot behavior')}</small></div>
      <div><time>RECORD</time><span class="ok"></span><b>${t('每一步都有记录','Every step is recorded')}</b><small>${t('谁修改、谁批准都可查','Changes and approvals are traceable')}</small></div>
    </div><aside class="wb-audit-thesis"><span class="wb-mini-label">CARDBOT</span><strong>${t('不是随便聊天','Not open-ended chat')}</strong><strong>${t('只做授权工作','Only authorized work')}</strong><strong>${t('关键动作由人确认','Humans approve key actions')}</strong><p>${t('能力相同，权限因人而异。','Same capabilities, access scoped to each person.')}</p></aside></div>
  </section>`;

  return `<section class="wb-capability-slide" data-testid="channel-summary-slide">
    <div class="wb-slide-intro"><span class="wb-slide-kicker">CHANNEL + WORKSPACE / 05</span><h3>${t('渠道负责快速处理，工作台负责完整管理','Channels handle quick actions. The workbench handles full management.')}</h3><p>${t('不把整个工作台搬进聊天软件，只把业务员当下需要处理的动作送到面前。','Do not squeeze the whole workbench into chat—bring forward only the action needed now.')}</p></div>
    <div class="wb-shared-channel-strip"><div>${channelLogo('wechat')}${channelLogo('lark')}${channelLogo('whatsapp')}</div><span>→</span><strong>CardBot</strong><small>${t('消息卡片 · 快速操作','MESSAGE CARDS · QUICK ACTIONS')}</small></div>
    <div class="wb-decision-pipeline">
      <article><span>01 / ALERT</span><b>${t('收到提醒','Receive an alert')}</b><small>${t('客户回复或发现新机会','Customer reply or new opportunity')}</small></article><i>→</i>
      <article><span>02 / CONTEXT</span><b>${t('看清建议','See the recommendation')}</b><small>${t('历史、问题和下一步','History, issue and next step')}</small></article><i>→</i>
      <article><span>03 / ACTION</span><b>${t('快速确认','Take quick action')}</b><small>${t('建任务、审草稿或暂不处理','Create, approve or defer')}</small></article><i>→</i>
      <article class="emphasis"><span>04 / WORKBENCH</span><b>${t('需要时打开工作台','Open the workbench when needed')}</b><small>${t('查看完整资料与审计记录','Full records and audit trail')}</small></article>
    </div>
    <div class="wb-flow-summary compact"><span>${t('一句话','IN ONE LINE')}</span><strong>${t('飞书等渠道是快捷入口，CardBot 工作台是完整业务系统。','Feishu and other channels are quick entry points; the CardBot workbench is the full business system.')}</strong></div>
  </section>`;
}

function presentationNav(t: (zh: string,en: string) => string, page: number) {
  return `<footer class="wb-presentation-nav"><span class="wb-presentation-count">${String(page + 1).padStart(2,'0')} / ${String(REMOTE_PRESENTATION_PAGE_COUNT).padStart(2,'0')}</span><div class="wb-presentation-dots" aria-label="${t('演讲页导航','Presentation page navigation')}">${Array.from({length:REMOTE_PRESENTATION_PAGE_COUNT},(_,index)=>`<button data-remote-page="${index}" class="${index===page?'active':''}" aria-label="${t(`第 ${index+1} 页`,`Page ${index+1}`)}" ${index===page?'aria-current="page"':''}></button>`).join('')}</div><div class="wb-presentation-arrows"><button data-wb-action="remote-page-prev" aria-label="${t('上一页','Previous page')}" ${page===0?'disabled':''}>←</button><button class="next" data-wb-action="remote-page-next" aria-label="${t('下一页','Next page')}" ${page===REMOTE_PRESENTATION_PAGE_COUNT-1?'disabled':''}>→</button></div></footer>`;
}

export function renderRemotePanel(locale: Locale, state: RemoteState, seed: number, requestedPage = 0) {
  const t = (zh: string,en: string) => locale === 'zh' ? zh : en;
  const page = Math.max(0,Math.min(REMOTE_PRESENTATION_PAGE_COUNT - 1,requestedPage));
  const status = {
    waiting:t('等待手机连接','Waiting for phone'),
    refreshed:t('二维码已刷新','QR code refreshed'),
    copied:t('当前预览链接已复制','Current preview link copied'),
    stopped:t('连接预览已停止','Connection preview stopped'),
    channels:t('Bot Channels 尚未接入','Bot Channels are not connected yet')
  }[state];
  const headings = [
    [t('连接 CardBot','Connect CardBot'),t('企业选一个常用渠道，功能都一样','Choose a company channel; the capabilities stay the same')],
    [t('一个入口，同样能力','One entry, same capabilities'),t('微信、飞书、WhatsApp 共用一套 CardBot','WeChat, Lark and WhatsApp share one CardBot')],
    [t('开发新客户','Find new customers'),t('找到目标企业，核实联系人，再由人确认触达','Find targets, verify contacts, then approve outreach')],
    [t('跟进现有客户','Follow up with customers'),t('看历史、判下一步、写草稿、人确认','Review history, decide, draft and approve')],
    [t('安全可控','Safe and controlled'),t('每人独立，AI 有边界，全程可追溯','Individual access, bounded AI and full traceability')],
    [t('渠道与工作台','Channels and workbench'),t('聊天里快速处理，复杂工作回到工作台','Quick actions in chat; full work in the workbench')]
  ];
  return `<div class="wb-remote-overlay" data-testid="remote-overlay">
    <button class="wb-remote-backdrop" data-wb-action="remote-close" aria-label="${t('关闭手机远程设置','Close mobile remote settings')}"></button>
    <section class="wb-remote-dialog wb-presentation-dialog" role="dialog" aria-modal="true" aria-labelledby="remote-title" data-testid="remote-dialog" data-remote-page="${page}">
      <header><span class="wb-remote-heading-icon">${remoteDeviceIcon()}</span><div><h2 id="remote-title">${headings[page][0]}</h2><p>${headings[page][1]}</p></div><span class="wb-vision-label">${t('规划能力','VISION')}</span><button class="wb-remote-close" data-wb-action="remote-close" aria-label="${t('关闭','Close')}">×</button></header>
      <div class="wb-remote-page" data-testid="remote-page" aria-live="polite">${page===0?remoteConnectPage(t,state,seed,status):capabilityPage(t,page)}</div>
      ${presentationNav(t,page)}
    </section>
  </div>`;
}
