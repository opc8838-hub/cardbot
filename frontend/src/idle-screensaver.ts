import { mountTextArt } from './text-art';

export const IDLE_SCREENSAVER_DELAY_MS = 20_000;

type Locale = 'zh' | 'en';

export function createIdleScreensaver(locale: () => Locale, identity: () => string) {
  let idleTimer = 0;
  let clockTimer = 0;
  let overlay: HTMLElement | null = null;
  let releaseEarth = () => {};
  let lastPointerReset = 0;

  const clearIdleTimer = () => window.clearTimeout(idleTimer);
  const clearClock = () => window.clearInterval(clockTimer);

  function updateClock() {
    if (!overlay) return;
    const now = new Date();
    overlay.querySelectorAll<HTMLTimeElement>('[data-screensaver-clock]').forEach(time => {
      const zone = time.dataset.zone || 'Asia/Shanghai';
      time.textContent = now.toLocaleTimeString('en-GB', { timeZone: zone, hour: '2-digit', minute: '2-digit', second: zone === 'Asia/Shanghai' ? '2-digit' : undefined });
    });
    overlay.querySelectorAll<HTMLElement>('[data-screensaver-offset]').forEach(label => {
      const zone = label.dataset.zone || 'Asia/Shanghai';
      label.textContent = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value.replace('GMT', 'UTC') || '';
    });
  }

  function removeOverlay() {
    if (!overlay) return;
    const departing = overlay;
    overlay = null;
    releaseEarth();
    releaseEarth = () => {};
    clearClock();
    document.documentElement.classList.remove('wb-screensaver-active');
    departing.classList.remove('is-visible');
    departing.classList.add('is-leaving');
    window.setTimeout(() => departing.remove(), 280);
  }

  function show() {
    if (overlay || document.hidden) return;
    const isZh = locale() === 'zh';
    const now = new Date();
    const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', hour12: false }).format(now));
    const greeting = hour >= 6 && hour < 14 ? (isZh ? '早上好' : 'Good morning') : hour < 18 ? (isZh ? '下午好' : 'Good afternoon') : (isZh ? '晚上好' : 'Good evening');
    const nav = isZh ? ['工作日','事实依据','草稿','团队','连接','企业'] : ['Workday','Evidence','Drafts','Team','Connect','Organization'];
    const zones = [
      ['Europe/London',isZh?'伦敦':'London'],
      ['America/Los_Angeles',isZh?'洛杉矶':'Los Angeles'],
      ['America/New_York',isZh?'纽约':'New York'],
      ['Asia/Dubai',isZh?'迪拜':'Dubai'],
      ['Asia/Shanghai',isZh?'上海':'Shanghai'],
      ['Australia/Sydney',isZh?'悉尼':'Sydney']
    ];
    overlay = document.createElement('section');
    overlay.className = 'wb-screensaver';
    overlay.dataset.testid = 'idle-screensaver';
    overlay.setAttribute('aria-label', isZh ? 'CardBot 文字地球屏保' : 'CardBot text globe screensaver');
    overlay.innerHTML = `
      <header class="wb-screensaver-header"><strong>cardbot<sup>®</sup></strong><nav>${nav.map((item,index)=>`<span class="${index===0?'active':''}">${item}</span>`).join('')}</nav><div><span>${isZh?'EN':'中文'}</span><span>◐ ${isZh?'深色':'Dark'}</span><span>↻ ${isZh?'开场':'Intro'}</span></div></header>
      <div class="wb-screensaver-ribbon"><p><i></i><b>INTERACTIVE PREVIEW</b><span>${isZh?'虚构演示数据 · 保存在当前浏览器 · 不发送邮件':'Fictional preview data · saved in this browser · no email is sent'}</span></p><p><small>${isZh?'演示身份':'DEMO IDENTITY'}</small><b>${identity()}</b><span>${isZh?'真实 CRM 独立入口 ↗':'Authenticated CRM entrance ↗'}</span></p></div>
      <main class="wb-screensaver-stage">
        <section class="wb-screensaver-copy"><span>${isZh?'你的全球业务，都在同一个工作日。':'YOUR WORLD. IN ONE WORKDAY.'}</span><h1><strong>${greeting}</strong><strong>${isZh?'让我们推动':"Let's move"}</strong><em>${isZh?'工作向前':'work forward'}</em></h1><p>${isZh?'每一次跟进，都有据可依。<br>从早间待办，到晚间复盘。':'Every follow-up is grounded in evidence.<br>From the morning list to the evening recap.'}</p><div><b>${isZh?'打开今日任务 ↗':"Open today's tasks ↗"}</b><span>${isZh?'查看晚间复盘':'View evening recap'}</span></div></section>
        <section class="wb-screensaver-earth"><canvas data-testid="screensaver-earth" role="img" aria-label="${isZh ? '自动旋转的文字地球' : 'Rotating text globe'}"></canvas><i>+</i>${zones.map(([zone,label],index)=>`<span class="wb-screensaver-zone zone-${index+1}"><b>${label}</b><time data-screensaver-clock data-zone="${zone}"></time><small data-screensaver-offset data-zone="${zone}"></small></span>`).join('')}<p>${isZh?'对话组成的世界<br>拖动探索':'A WORLD OF CONVERSATIONS<br>DRAG TO EXPLORE'}</p></section>
        <aside class="wb-screensaver-info"><span>${isZh?'本地时间 / 实时时钟':'LOCAL TIME / LIVE CLOCK'}</span><time data-screensaver-clock data-zone="Asia/Shanghai"></time><small>Asia/Shanghai</small><hr><span>${isZh?'市场 / 演示城市':'MARKET / DEMO CITY'}</span><b>${isZh?'上海':'Shanghai'} · Asia/Shanghai⌄</b><time data-screensaver-clock data-zone="Asia/Shanghai"></time><small>31.2304° N / 121.4737° E</small><p>${isZh?'城市坐标为预置参考<br>不是客户真实地址':'City coordinates are preset references<br>not actual customer addresses'}</p></aside>
        <footer><span>01 / ${isZh?'全球工作台':'GLOBAL WORKSPACE'}</span><span>VIEW CENTER / 98.5° E</span><span>${isZh?'点击任意位置返回工作台':'CLICK ANYWHERE TO RETURN'}</span></footer>
      </main>`;
    document.body.append(overlay);
    document.documentElement.classList.add('wb-screensaver-active');
    releaseEarth = mountTextArt(overlay.querySelector('canvas')!, 'earth');
    updateClock();
    clockTimer = window.setInterval(updateClock, 1000);
    requestAnimationFrame(() => overlay?.classList.add('is-visible'));
  }

  function schedule() {
    clearIdleTimer();
    if (!document.hidden && !overlay) idleTimer = window.setTimeout(show, IDLE_SCREENSAVER_DELAY_MS);
  }

  function activity(event?: Event) {
    const wasVisible = Boolean(overlay);
    if (event?.type === 'pointermove') {
      if (overlay) return;
      const now = performance.now();
      if (now - lastPointerReset < 350) return;
      lastPointerReset = now;
    }
    if (wasVisible) event?.stopImmediatePropagation();
    removeOverlay();
    schedule();
  }

  function visibility() {
    if (document.hidden) {
      clearIdleTimer();
      removeOverlay();
      return;
    }
    schedule();
  }

  const events: Array<keyof DocumentEventMap> = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
  events.forEach(type => document.addEventListener(type, activity, { passive: true, capture: true }));
  window.addEventListener('scroll', activity, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  schedule();

  return {
    reset: schedule,
    show,
    destroy() {
      clearIdleTimer();
      clearClock();
      releaseEarth();
      overlay?.remove();
      overlay = null;
      document.documentElement.classList.remove('wb-screensaver-active');
      events.forEach(type => document.removeEventListener(type, activity, { capture: true }));
      window.removeEventListener('scroll', activity);
      document.removeEventListener('visibilitychange', visibility);
    }
  };
}
