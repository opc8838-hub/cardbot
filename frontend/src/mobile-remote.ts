type Locale = 'zh' | 'en';
export type RemoteState = 'waiting' | 'refreshed' | 'copied' | 'stopped' | 'channels';

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
            <article>${channelLogo('wechat')}<div><h4>${t('微信','WeChat')}</h4><p>${t('从微信会话打开这个工作区','Open this workspace from a WeChat chat')}</p><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
            <article>${channelLogo('lark')}<div><h4>${t('飞书','Lark')}</h4><p>${t('从飞书打开这个工作区','Open this workspace from Lark')}</p><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
            <article>${channelLogo('whatsapp')}<div><h4>WhatsApp</h4><p>${t('从 WhatsApp 打开这个工作区','Open this workspace from WhatsApp')}</p><button data-wb-action="remote-channel">${t('去 Bot Channels 配置','Configure Bot Channels')}</button></div></article>
          </div><button class="wb-bot-manager" data-wb-action="remote-channel">♙ ${t('机器人管理','Bot management')}</button>
        </section>
      </div>
    </section>
  </div>`;
}
