type Locale = 'zh' | 'en';
export type RemoteState = 'waiting' | 'refreshed' | 'copied' | 'stopped' | 'channels';

export function remoteDeviceIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="12" height="9" rx="1.8"></rect><path d="M7.5 17.5h4M9.5 13.5v4"></path><rect x="14.5" y="10.5" width="6" height="9" rx="1.5"></rect><path d="M16.8 17.2h1.4"></path></svg>`;
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

export function renderRemotePanel(locale: Locale, state: RemoteState, seed: number) {
  const t = (zh: string,en: string) => locale === 'zh' ? zh : en;
  const status = {
    waiting:t('等待手机连接','Waiting for phone'),
    refreshed:t('二维码已刷新','QR code refreshed'),
    copied:t('当前预览链接已复制','Current preview link copied'),
    stopped:t('连接预览已停止','Connection preview stopped'),
    channels:t('Bot Channels 尚未接入','Bot Channels are not connected yet')
  }[state];
  return `<div class="wb-remote-overlay" data-testid="remote-overlay">
    <button class="wb-remote-backdrop" data-wb-action="remote-close" aria-label="${t('关闭手机远程设置','Close mobile remote settings')}"></button>
    <section class="wb-remote-dialog" role="dialog" aria-modal="true" aria-labelledby="remote-title" data-testid="remote-dialog">
      <header><span class="wb-remote-heading-icon">${remoteDeviceIcon()}</span><div><h2 id="remote-title">${t('移动端远程控制','Mobile remote control')}</h2><p>${t('扫码或在手机上打开链接，即可从移动端访问当前工作区','Scan or open the link on your phone to access this workspace from mobile')}</p></div><button class="wb-remote-close" data-wb-action="remote-close" aria-label="${t('关闭','Close')}">×</button></header>
      <div class="wb-remote-grid">
        <section class="wb-remote-connect"><div class="wb-remote-section-title"><span>▯</span><div><h3>${t('手机扫码连接','Connect by phone')}</h3><p>${t('使用手机相机扫码，在手机上打开当前工作区','Scan with your phone camera to open this workspace')}</p></div></div>
          <div class="wb-remote-status"><div><strong>${status}</strong><span class="${state==='stopped'?'stopped':''}"></span></div><p>${t('当前仅展示远程入口界面，尚未接入真实跨设备会话服务','This previews the remote entry UI; no cross-device session service is connected yet')}</p><div class="wb-remote-tools"><button data-wb-action="remote-refresh">↻ ${t('刷新二维码','Refresh QR')}</button><button data-wb-action="remote-copy">▢ ${t('复制链接','Copy link')}</button><button data-wb-action="remote-stop">⌁ ${t('停止','Stop')}</button></div></div>
          <div class="wb-remote-qr-wrap">${qrPreview(seed)}</div>
        </section>
        <section class="wb-remote-channels"><div class="wb-remote-section-title"><span>♙</span><div><h3>${t('使用 Bot Channel','Use a Bot Channel')}</h3><p>${t('连接聊天 Bot，适合更长时间的移动端访问','Connect a chat bot for longer mobile access')}</p></div></div>
          <div class="wb-channel-list">
            <article><span class="wb-channel-logo wechat">微</span><div><h4>${t('微信','WeChat')}</h4><p>${t('从微信会话打开这个工作区','Open this workspace from a WeChat chat')}</p><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
            <article><span class="wb-channel-logo lark">飞</span><div><h4>${t('飞书','Lark')}</h4><p>${t('从飞书打开这个工作区','Open this workspace from Lark')}</p><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
            <article><span class="wb-channel-logo whatsapp">WA</span><div><h4>WhatsApp</h4><p>${t('从 WhatsApp 打开这个工作区','Open this workspace from WhatsApp')}</p><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
          </div><button class="wb-bot-manager" data-wb-action="remote-channel">♙ ${t('机器人管理','Bot management')}</button>
        </section>
      </div>
    </section>
  </div>`;
}
