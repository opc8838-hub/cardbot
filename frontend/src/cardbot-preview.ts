import "./cardbot-preview.css";
import { mountTextArt } from "./text-art";
import { loadPreview, freshPreview, createDraft, editDraft, approveDraft, saveDraft, completeTask, STORAGE_KEY } from "./preview-store";

const root = document.querySelector<HTMLDivElement>("#cardbot")!;
const state = loadPreview(localStorage);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
type Locale = "zh" | "en";
let selected = "TASK-001", currentView = "workday", currentScreen: "hello" | "manifesto" | "workspace" = "hello", disposeArt = () => {}, clock = 0, cancelled = false;
let locale: Locale = localStorage.getItem("cardbot_locale") === "en" ? "en" : "zh";
let selectedMarket = localStorage.getItem("cardbot_market") || "Asia/Shanghai";
const names = { open: "进行中", needs_confirmation: "待确认", done: "已完成" };
const draftNames = { empty: "尚未生成", awaiting_review: "待人工审核", approved: "已审核 · 待保存", saved_local: "已保存至本地" };
document.documentElement.dataset.theme = localStorage.getItem("cardbot_theme") === "dark" ? "dark" : "light";
const pill = (label: string, action: string, extra = "") => `<button class="pill ${extra}" data-action="${action}">${label}</button>`;
const themeButton = () => pill(document.documentElement.dataset.theme === "dark" ? (locale === "zh" ? "◐ 浅色" : "◐ Light") : (locale === "zh" ? "◐ 深色" : "◐ Dark"), "theme");
const languageButton = () => pill(locale === "zh" ? "EN" : "中文", "language", "language-pill");
const ZH_TO_EN: Record<string, string> = {
  "工作日":"Workday", "事实依据":"Evidence", "草稿":"Drafts", "审核":"Review", "起草":"Draft", "交付":"Deliver", "团队":"Team", "连接":"Connect",
  "工作台":"Workspace", "工作台 ↗":"Workspace ↗", "跳过动画 ↗":"Skip intro ↗", "进入工作台 ↗":"Enter workspace ↗", "↺ 开场":"↺ Intro", "02 / 工作方式":"02 / THE WAY WE WORK",
  "从已发生的对话。":"From what was said.", "到接下来要做的事。":"To what happens next.",
  "同一个工作日，每一次对话。":"One workday. Every conversation.", "01 — 欢迎":"01 — WELCOME",
  "虚构演示数据 · 保存在当前浏览器 · 不发送邮件":"Fictional preview data · saved in this browser · no email is sent",
  "真实 CRM 独立入口 ↗":"Authenticated CRM entrance ↗", "你的全球业务，都在同一个工作日。":"YOUR WORLD. IN ONE WORKDAY.",
  "早上好。":"Good morning.", "让我们推动":"Let's move", "工作向前。":"work forward.",
  "每一次跟进，都有据可依。":"Every follow-up is grounded in evidence.", "从早间待办，到晚间复盘。":"From the morning list to the evening recap.",
  "打开今日任务 ↗":"Open today's tasks ↗", "查看晚间复盘":"View evening recap", "由小字组成大陆的旋转地球；可拖动或用左右方向键旋转":"Rotating text-built Earth; drag or use arrow keys",
  "对话组成的世界":"A WORLD OF CONVERSATIONS", "拖动探索":"DRAG TO EXPLORE", "本地时间":"LOCAL TIME", "实时时钟":"LIVE CLOCK",
  "市场 / 演示城市":"MARKET / DEMO CITY", "城市坐标为预置参考":"City coordinates are preset references", "不是客户真实地址":"not actual customer addresses",
  "01 / 全球工作台":"01 / GLOBAL WORKSPACE", "人工始终在环":"HUMAN IN THE LOOP", "同一批任务":"ONE SHARED TASK LIST",
  "你的工作，正在推进。":"Your work, in motion.", "每个事实都有来源。":"Every fact has a source.", "起草、审核、保留。":"Draft. Review. Keep.", "一个团队，一份事实。":"One team. One truth.", "放心连接。":"Connect with confidence.",
  "早间清单":"Morning list", "晚间复盘":"Evening recap", "今日任务":"TODAY'S TASKS", "已完成":"COMPLETED", "有完成依据":"with completion evidence", "待跟进":"NEEDS FOLLOW-UP", "本地草稿":"LOCAL DRAFT", "不是小满草稿":"not an OKKI draft",
  "进行中":"In progress", "待确认":"Needs confirmation", "早晚使用同一份任务状态。生成草稿 ≠ 已发送报价。":"Morning and evening share one task list. A draft ≠ a sent quotation.",
  "下班前再看一眼。":"Before you sign off.", "缺少：":"Missing: ", "下一步：":"Next: ", "本批任务均已人工确认完成。":"All tasks in this batch were confirmed by a human.",
  "来源记录":"SOURCE RECORD", "已知事实":"Confirmed facts", "待确认事项":"Needs confirmation", "完成依据 · 人工确认":"Completion evidence · human confirmed", "记录完成依据":"Record completion evidence", "例如：已提交汇总，记录编号 REPORT-001":"Example: summary submitted, record REPORT-001", "确认完成":"Confirm complete", "生成回复草稿 ↗":"Generate reply draft ↗", "查看回复草稿 ↗":"View reply draft ↗",
  "客户询问 CB-20，数量 200 件。来自上方 EMAIL-001；没有已确认价格或交期。":"The customer asked about 200 units of CB-20 in EMAIL-001. No price or delivery date is confirmed.", "以上原始安排是本项任务的来源；未提供的内容不得补猜。":"The source record above created this task. Missing details must not be guessed.",
  "事实先于流畅。":"Facts before fluency.", "已确认：CB-20 / 200 units。":"Confirmed: CB-20 / 200 units.", "未确认：价格、交期。":"Unconfirmed: price and delivery date.", "此预览用固定模板，不调用 DeepSeek。正文不包含未经确认的价格或交期。":"This preview uses a fixed template and does not call DeepSeek. It includes no unconfirmed price or delivery date.", "收件人：":"To: ", "主题：":"Subject: ", "保留域名 .example，仅作演示，不会发送。":"The .example domain is reserved for demos; nothing is sent.", "浏览器本地草稿":"LOCAL DRAFT / BROWSER ONLY", "一封经过考虑的回复。":"A considered reply.", "先读取历史邮件，再生成待审核草稿。":"Read the historical email first, then create a draft for review.", "生成演示草稿 ↗":"Generate demo draft ↗", "邮件正文（编辑后必须重新审核）":"Email body (editing requires a new review)", "我已核对来源、收件人和正文，没有未经确认的业务承诺。":"I checked the source, recipient and body; there are no unconfirmed business commitments.", "人工审核通过":"Approve after human review", "保存本地草稿 ↓":"Save local draft ↓", "尚未生成":"Not generated", "待人工审核":"Awaiting human review", "已审核 · 待保存":"Reviewed · ready to save", "已保存至本地":"Saved locally",
  "同一任务，共享进度。":"Same tasks. Shared progress.", "当前预览只有一位演示业务员。管理汇总直接读取同一批任务，不另造一套完成率。":"This preview has one demo salesperson. The manager summary reads the same tasks instead of inventing another completion rate.", "当天的轨迹。":"The day's trail.", "这是浏览器演示记录，不是服务端不可篡改审计日志。":"This is a browser demo trail, not a tamper-proof server audit log.",
  "导出演示数据 ↓":"Export preview data ↓", "事实优先，始终由人把关。":"Evidence first. Humans always.",
  "准备新版报价回复":"Prepare the revised quotation reply", "提交客户跟进汇总":"Submit the customer follow-up summary", "确认样品寄送地址":"Confirm the sample shipping address",
  "内部协作 · Sales team":"Internal collaboration · Sales team", "EMAIL-001 · 客户历史邮件":"EMAIL-001 · customer email history", "BRIEF-002 · 上级工作安排":"BRIEF-002 · manager assignment", "REQUEST-003 · 跨部门协同":"REQUEST-003 · cross-team request",
  "今日下班前（演示安排）":"Before end of day (demo schedule)", "今日 12:00（演示安排）":"Today 12:00 (demo schedule)",
  "新版价格、供应商确认交期":"Revised price and supplier-confirmed delivery date", "汇总提交记录":"Submission record for the summary", "客户确认的完整地址、期限":"Customer-confirmed full address and deadline",
  "向产品负责人确认价格和交期；草稿不得替代已发送报价。":"Confirm price and delivery with the product owner; a draft is not a sent quotation.", "整理跟进情况并记录提交凭据。":"Compile follow-ups and record submission evidence.", "向客户核对地址；不根据城市猜测街道或邮编。":"Confirm the address with the customer; do not guess a street or postcode from the city.",
  "MORNING / 今日任务":"MORNING / TODAY'S TASKS", "EVENING / 今日最终状态":"EVENING / FINAL STATUS TODAY", "3 ITEMS":"3 ITEMS",
  "已保存至当前浏览器。未写入小满，未发送；任务不会自动变成已完成。":"Saved in this browser. Not written to OKKI and not sent; the task is not automatically complete.",
  "内容已修改 · 需重新审核":"Edited · review required again", "请先勾选核对确认，再通过审核。":"Check the verification box before approval.", "人工审核已记录。现在可以保存本地草稿。":"Human review recorded. The local draft can now be saved.", "本地草稿已保存；未发送，也未写入小满。":"Local draft saved; it was not sent or written to OKKI.", "操作未完成，请重试。":"The action was not completed. Please try again.",
  "未接入":"Not connected", "待授权验证":"Awaiting authorized verification", "EML 解析基础":"EML parsing foundation",
  "已预留后端模型接口方向；本页草稿是模板。真实 Key 只放服务器环境变量，不进前端和 Git。":"A backend model adapter direction exists; this page uses a template. Real keys stay in server environment variables, never frontend code or Git.",
  "Mock 可用；官方 API 是通用适配骨架；RPA 缺真实驱动。网页账号不等于 API 权限。":"Mock is available; the official API path is a generic adapter skeleton; RPA has no real driver. A web account is not API permission.",
  "后端有 PostalMime 解析和事实依据草稿接口。此预览展示虚构样本，尚未接真实邮箱。":"The backend has PostalMime parsing and an evidence-backed draft interface. This preview uses fictional samples and is not connected to a real mailbox.",
  "接下来验收：真实小满保存 → 草稿箱内容复核 → 重新登录再次复核。上述步骤尚未完成。":"Next validation: save to real OKKI → verify draft-box content → sign in again and verify. These steps are not yet complete."
};
const EN_TO_ZH = Object.fromEntries(Object.entries(ZH_TO_EN).map(([zh, en]) => [en, zh]));
function translateDom() {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  const map = locale === "en" ? ZH_TO_EN : EN_TO_ZH;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if ((node.parentElement?.tagName || "") === "TEXTAREA") continue;
    const value = node.nodeValue || "", trimmed = value.trim(), translated = map[trimmed];
    if (translated) node.nodeValue = value.replace(trimmed, translated);
  }
  root.querySelectorAll<HTMLElement>("[placeholder]").forEach(element => { const value = element.getAttribute("placeholder") || ""; if (map[value]) element.setAttribute("placeholder", map[value]); });
  root.querySelectorAll<HTMLElement>("[aria-label]").forEach(element => { const value = element.getAttribute("aria-label") || ""; if (map[value]) element.setAttribute("aria-label", map[value]); });
}
function localizeValue(value: string) {
  if (locale === "zh") return EN_TO_ZH[value] || value;
  const exact = ZH_TO_EN[value];
  if (exact) return exact;
  return value
    .replace("早间清单已建立 · 同一批 3 项任务", "Morning list created · same batch of 3 tasks")
    .replace("根据 EMAIL-001 模板生成草稿 · 未接模型 · 价格/交期待确认", "Draft created from the EMAIL-001 template · no model connected · price/delivery unconfirmed")
    .replace("人工审核通过 · 演示用户", "Human review approved · demo user")
    .replace("保存至此浏览器本地草稿 · 未写入小满 · 未发送", "Saved as a local browser draft · not written to OKKI · not sent")
    .replace(" 人工确认完成 · ", " human-confirmed complete · ");
}
const MARKETS = [
  ["Pacific/Honolulu", "檀香山", "Honolulu", "21.3069° N / 157.8583° W"],
  ["America/Los_Angeles", "洛杉矶", "Los Angeles", "34.0522° N / 118.2437° W"],
  ["America/New_York", "纽约", "New York", "40.7128° N / 74.0060° W"],
  ["America/Sao_Paulo", "圣保罗", "São Paulo", "23.5505° S / 46.6333° W"],
  ["Europe/London", "伦敦", "London", "51.5072° N / 0.1276° W"],
  ["Europe/Paris", "巴黎", "Paris", "48.8566° N / 2.3522° E"],
  ["Asia/Dubai", "迪拜", "Dubai", "25.2048° N / 55.2708° E"],
  ["Asia/Shanghai", "上海", "Shanghai", "31.2304° N / 121.4737° E"],
  ["Asia/Tokyo", "东京", "Tokyo", "35.6762° N / 139.6503° E"],
  ["Australia/Sydney", "悉尼", "Sydney", "33.8688° S / 151.2093° E"],
  ["Pacific/Auckland", "奥克兰", "Auckland", "36.8509° S / 174.7645° E"]
] as const;
const marketOptions = () => MARKETS.map(([zone, zh, en]) => `<option value="${zone}" ${zone === selectedMarket ? "selected" : ""}>${locale === "zh" ? zh : en} · ${zone}</option>`).join("");
const timeZoneChips = () => ["America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Dubai", "Asia/Shanghai", "Australia/Sydney"].map(zone => {
  const market = MARKETS.find(item => item[0] === zone)!;
  return `<span class="time-chip" data-zone="${zone}" data-city="${locale === "zh" ? market[1] : market[2]}"><b>${locale === "zh" ? market[1] : market[2]}</b><time>--:--</time><i>UTC</i></span>`;
}).join("");
function zoneOffset(date: Date, zone: string) {
  const value = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(date).find(part => part.type === "timeZoneName")?.value || "GMT";
  return value === "GMT" ? "UTC±0" : value.replace("GMT", "UTC");
}
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { toast("浏览器未允许存储，请导出备份；刷新后可能丢失。"); } }
function toast(message: string) { const node = document.querySelector<HTMLElement>("#notice"); if (node) { node.textContent = message; node.hidden = false; } }
function clean() { disposeArt(); window.clearInterval(clock); }
function header(section: string) {
  return `<header class="masthead"><a class="wordmark" href="/">cardbot<span>®</span></a><span class="section-label">${section}</span><div class="header-actions">${languageButton()}${themeButton()}${pill("工作台 ↗", "workspace")}</div></header>`;
}
async function entrance() {
  clean(); cancelled = false; currentScreen = "hello";
  root.innerHTML = `<section class="hello-screen"><div class="intro-top"><span>CARDBOT / GLOBAL TRADE</span><div class="intro-actions">${languageButton()}${pill("跳过动画 ↗", "skip")}</div></div><div class="greeting"><span class="hello-dot">•</span><span id="hello-word">Hello</span></div><footer>同一个工作日，每一次对话。<span>01 — 欢迎</span></footer></section>`;
  translateDom();
  root.querySelector('[data-action="skip"]')?.addEventListener("click", () => { cancelled = true; manifesto(); });
  const word = document.querySelector<HTMLElement>("#hello-word")!;
  const greetings = [["Hello", "en"], ["你好", "zh-CN"], ["Hola", "es"], ["Bonjour", "fr"], ["مرحباً", "ar"], ["こんにちは", "ja"]];
  const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));
  if (reduced.matches) { word.textContent = "Hello / 你好"; return; }
  await wait(1000);
  for (const [text, lang] of greetings.slice(1)) {
    if (cancelled) return;
    word.classList.add("out"); await wait(280); if (cancelled) return;
    word.textContent = text; word.lang = lang; word.classList.remove("out");
    await wait(850);
  }
  if (!cancelled) manifesto();
}
function manifesto() {
  clean(); cancelled = true; currentScreen = "manifesto";
  root.innerHTML = `<section class="manifesto">${header(locale === "zh" ? "02 / 工作方式" : "02 / THE WAY WE WORK")}<div class="word-field"><canvas id="card-letters" aria-hidden="true"></canvas><h1 class="capabilities"><span>${locale === "zh" ? "事实依据" : "Evidence"}</span><span>${locale === "zh" ? "工作日" : "Workday"}</span><span>${locale === "zh" ? "审核" : "Review"}</span><span>${locale === "zh" ? "起草" : "Draft"}</span><span>${locale === "zh" ? "交付" : "Deliver"}</span></h1></div><footer class="manifesto-footer"><p>从已发生的对话。<br>到接下来要做的事。</p><div><span class="mono">HISTORY → HUMAN REVIEW → LOCAL DRAFT</span>${pill("进入工作台 ↗", "workspace", "primary")}</div></footer></section>`;
  translateDom();
  disposeArt = mountTextArt(document.querySelector<HTMLCanvasElement>("#card-letters")!, "card");
  // Deliberately no timer: readers choose when to leave this typographic page.
}
function workspace(view = currentView) {
  clean(); cancelled = true; currentView = view; currentScreen = "workspace";
  sessionStorage.setItem("cardbot_intro_v2", "seen");
  const completed = state.tasks.filter(t => t.status === "done").length;
  root.innerHTML = `<div class="workspace-frame">
    <header class="masthead"><a class="wordmark" href="/">cardbot<span>®</span></a><nav aria-label="工作台导航">${[ ["workday", "工作日"], ["evidence", "事实依据"], ["drafts", "草稿"], ["team", "团队"], ["connections", "连接"] ].map(([id,label]) => `<button data-view="${id}" class="nav-link ${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""}>${label}</button>`).join("")}</nav><div class="header-actions">${languageButton()}${themeButton()}${pill("↺ 开场", "replay")}</div></header>
    <div class="preview-ribbon"><span><i></i> INTERACTIVE PREVIEW</span><span>虚构演示数据 · 保存在当前浏览器 · 不发送邮件</span><a href="/crm.html?intro=0">真实 CRM 独立入口 ↗</a></div>
    <main class="workspace-main">
      <section class="world-stage" aria-label="全球贸易文字地球">
        <div class="world-heading"><p class="eyebrow">你的全球业务，都在同一个工作日。</p><h1>早上好。<br>让我们推动<br><em>工作向前。</em></h1><p class="intro-copy">每一次跟进，都有据可依。<br>从早间待办，到晚间复盘。</p><div class="world-actions">${pill("打开今日任务 ↗", "tasks", "primary")}${pill("查看晚间复盘", "evening")}</div></div>
        <div class="earth-wrap"><canvas id="text-earth" tabindex="0" role="img" aria-label="由小字组成大陆的旋转地球；可拖动或用左右方向键旋转"></canvas><div class="time-zone-layer" aria-label="全球实时时区">${timeZoneChips()}</div><span class="earth-cross top">+</span><span class="earth-cross bottom">+</span><span class="earth-foot mono">对话组成的世界<br>拖动探索</span></div>
        <aside class="world-coordinates"><span class="eyebrow">本地时间 / 实时时钟</span><time id="local-time"></time><span id="local-zone" class="mono"></span><hr><label for="city">市场 / 演示城市</label><select id="city">${marketOptions()}</select><time id="market-time"></time><span id="coordinates" class="mono">31.2304° N / 121.4737° E</span><span class="coordinate-note">城市坐标为预置参考<br>不是客户真实地址</span></aside>
        <div class="world-bottom mono"><span>01 / 全球工作台</span><span id="rotation">VIEW CENTER / 100° E</span><span>人工始终在环</span></div>
      </section>
      <section id="operations" class="operations">
        <div class="operation-heading"><div><span class="eyebrow">${state.batch} / ONE SHARED TASK LIST</span><h2>${view === "workday" ? "Your work, in motion." : ({evidence:"Every fact has a source.", drafts:"Draft. Review. Keep.", team:"One team. One truth.", connections:"Connect with confidence."} as Record<string,string>)[view]}</h2></div><div class="phase-switch" aria-label="早晚视图"><button data-action="morning" class="${state.phase === "morning" ? "active" : ""}">早间清单</button><button data-action="evening" class="${state.phase === "evening" ? "active" : ""}">晚间复盘</button></div></div>
        <div class="metrics"><div><span>TODAY'S TASKS</span><strong>03<small>同一批任务</small></strong></div><div><span>COMPLETED</span><strong>0${completed}<small>有完成依据</small></strong></div><div><span>NEEDS FOLLOW-UP</span><strong>0${3-completed}<small>待跟进</small></strong></div><div><span>LOCAL DRAFT</span><strong>${state.draft.status === "saved_local" ? "01" : "00"}<small>不是小满草稿</small></strong></div></div>
        <div id="notice" class="notice" role="status" hidden></div>
        ${view === "connections" ? connectionContent() : view === "drafts" ? draftContent() : view === "team" ? teamContent() : taskContent(view === "evidence")}
      </section>
    </main><footer class="workspace-footer"><span class="wordmark">cardbot.</span><span>事实优先，始终由人把关。</span><div>${pill("导出演示数据 ↓", "export")}</div></footer></div>`;
  translateDom();
  disposeArt = mountTextArt(document.querySelector<HTMLCanvasElement>("#text-earth")!, "earth", lon => {
    const element = document.querySelector("#rotation"); const normalized = ((lon + 180) % 360 + 360) % 360 - 180;
    if (element) element.textContent = `VIEW CENTER / ${Math.abs(normalized).toFixed(1)}° ${normalized >= 0 ? "E" : "W"}`;
  });
  const updateClock = () => {
    const now = new Date(); const city = document.querySelector<HTMLSelectElement>("#city")!.value;
    const time = document.querySelector<HTMLTimeElement>("#local-time")!;
    time.textContent = now.toLocaleTimeString("en-GB"); time.dateTime = now.toISOString();
    document.querySelector("#local-zone")!.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.querySelector("#market-time")!.textContent = now.toLocaleTimeString("en-GB", { timeZone: city });
    document.querySelector("#coordinates")!.textContent = MARKETS.find(item => item[0] === city)?.[3] || "";
    document.querySelectorAll<HTMLElement>(".time-chip").forEach(chip => {
      const zone = chip.dataset.zone!;
      chip.querySelector("time")!.textContent = now.toLocaleTimeString("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit" });
      chip.querySelector("i")!.textContent = zoneOffset(now, zone);
    });
  };
  updateClock(); clock = window.setInterval(updateClock, 1000);
  root.querySelector("#city")?.addEventListener("change", event => {
    selectedMarket = (event.target as HTMLSelectElement).value;
    localStorage.setItem("cardbot_market", selectedMarket);
    updateClock();
  });
  root.querySelector("#draft-body")?.addEventListener("input", event => {
    editDraft(state, (event.target as HTMLTextAreaElement).value); save();
    document.querySelector("#draft-status")!.textContent = locale === "zh" ? "内容已修改 · 需重新审核" : "Edited · review required again";
    (document.querySelector('[data-action="approve"]') as HTMLButtonElement).disabled = false;
    (document.querySelector('[data-action="save-draft"]') as HTMLButtonElement).disabled = true;
    (document.querySelector("#review-check") as HTMLInputElement).checked = false;
  });
}
function taskContent(evidenceOnly: boolean) {
  const task = state.tasks.find(item => item.id === selected)!;
  return `<div class="task-layout"><div class="task-list"><div class="list-caption"><span>${state.phase === "evening" ? "EVENING / 今日最终状态" : "MORNING / 今日任务"}</span><span>3 ITEMS</span></div>${state.tasks.map((t,index) => `<button class="task-row ${t.id === selected ? "selected" : ""}" data-task="${t.id}" aria-pressed="${t.id === selected}"><span class="task-number">0${index + 1}</span><span><small>${escape(localizeValue(t.company))}</small><strong>${escape(localizeValue(t.title))}</strong><em>${escape(localizeValue(t.deadline))}</em></span><span class="status ${t.status}">${names[t.status]}</span><span class="row-arrow">↗</span></button>`).join("")}<p class="table-note">早晚使用同一份任务状态。生成草稿 ≠ 已发送报价。</p>${state.phase === "evening" ? `<div class="recap"><h3>Before you sign off.</h3>${state.tasks.filter(t => t.status !== "done").map(t => `<p><b>${escape(localizeValue(t.title))}</b><br>${locale === "zh" ? "缺少" : "Missing"}：${escape(localizeValue(t.missing))}<br>${locale === "zh" ? "下一步" : "Next"}：${escape(localizeValue(t.next))}</p>`).join("") || "本批任务均已人工确认完成。"}</div>` : ""}</div><article class="detail-panel"><div class="detail-top"><span class="eyebrow">${escape(task.id)} / ${locale === "zh" ? "来源记录" : "SOURCE RECORD"}</span><span>↗</span></div><h3>${escape(localizeValue(task.title))}</h3><p class="source-label">${escape(localizeValue(task.source))}</p><blockquote>${escape(task.quote)}</blockquote><div class="fact-line"><b>已知事实</b><p>${task.id === "TASK-001" ? "客户询问 CB-20，数量 200 件。来自上方 EMAIL-001；没有已确认价格或交期。" : "以上原始安排是本项任务的来源；未提供的内容不得补猜。"}</p></div><div class="fact-line"><b>待确认</b><p>${escape(localizeValue(task.missing))}</p></div>${task.status === "done" ? `<div class="completion-proof"><b>完成依据 · 人工确认</b><p>${escape(task.evidence)}</p></div>` : `<label class="field-label" for="completion-evidence">记录完成依据</label><textarea id="completion-evidence" rows="2" placeholder="例如：已提交汇总，记录编号 REPORT-001"></textarea><div class="detail-actions">${pill("确认完成", "complete")}${task.id === "TASK-001" ? pill(evidenceOnly ? "查看回复草稿 ↗" : "生成回复草稿 ↗", "generate", "primary") : ""}</div>`}</article></div>`;
}
function draftContent() {
  return `<div class="draft-layout"><article class="detail-panel"><span class="eyebrow">SOURCE / EMAIL-001</span><h3>Facts before fluency.</h3><blockquote>${escape(state.tasks[0].quote)}</blockquote><p>已确认：CB-20 / 200 units。<br>未确认：价格、交期。</p><p class="table-note">此预览用固定模板，不调用 DeepSeek。正文不包含未经确认的价格或交期。</p><p>收件人：purchasing@nordic-tools.example<br>主题：Re: CB-20 inquiry<br><small>保留域名 .example，仅作演示，不会发送。</small></p></article><article class="detail-panel draft-editor"><div class="detail-top"><span class="eyebrow">LOCAL DRAFT / BROWSER ONLY</span><span id="draft-status" class="status">${draftNames[state.draft.status]}</span></div><h3>A considered reply.</h3>${state.draft.status === "empty" ? `<p>先读取历史邮件，再生成待审核草稿。</p>${pill("生成演示草稿 ↗", "generate", "primary")}` : `<label class="field-label" for="draft-body">邮件正文（编辑后必须重新审核）</label><textarea id="draft-body" rows="10">${escape(state.draft.body)}</textarea><label class="review-check"><input type="checkbox" id="review-check"> 我已核对来源、收件人和正文，没有未经确认的业务承诺。</label><div class="detail-actions"><button class="pill" data-action="approve" ${state.draft.status !== "awaiting_review" ? "disabled" : ""}>人工审核通过</button><button class="pill primary" data-action="save-draft" ${state.draft.status !== "approved" ? "disabled" : ""}>保存本地草稿 ↓</button></div>${state.draft.savedAt ? `<p class="save-receipt">LOCAL ONLY · ${escape(state.draft.savedAt)}<br>已保存在当前浏览器。未写入小满，未发送；任务不会自动变成已完成。</p>` : ""}`}</article></div>`;
}
function teamContent() {
  return `<div class="team-layout"><article class="detail-panel"><span class="eyebrow">MANAGER VIEW / DEMO TEAM</span><h3>Same tasks. Shared progress.</h3><p>当前预览只有一位演示业务员。管理汇总直接读取同一批任务，不另造一套完成率。</p>${state.tasks.map(t => `<div class="team-row"><span>${escape(t.id)} · ${escape(localizeValue(t.title))}</span><b>${names[t.status]}</b></div>`).join("")}</article><article class="detail-panel"><span class="eyebrow">ACTIVITY / 本地演示记录</span><h3>The day's trail.</h3><ol class="activity-list">${state.events.map(e => `<li>${escape(localizeValue(e))}</li>`).join("")}</ol><p class="table-note">这是浏览器演示记录，不是服务端不可篡改审计日志。</p></article></div>`;
}
function connectionContent() {
  return `<div class="connections">${[["01", "DeepSeek", "未接入", "已预留后端模型接口方向；本页草稿是模板。真实 Key 只放服务器环境变量，不进前端和 Git。"],["02", "OKKI / 小满", "待授权验证", "Mock 可用；官方 API 是通用适配骨架；RPA 缺真实驱动。网页账号不等于 API 权限。"],["03", "Historical mail", "EML 解析基础", "后端有 PostalMime 解析和事实依据草稿接口。此预览展示虚构样本，尚未接真实邮箱。"]].map(([n,title,status,text]) => `<article class="detail-panel"><span class="eyebrow">${n} / CONNECTOR</span><h3>${title}</h3><span class="status">${status}</span><p>${text}</p></article>`).join("")}</div><p class="table-note">接下来验收：真实小满保存 → 草稿箱内容复核 → 重新登录再次复核。上述步骤尚未完成。</p>`;
}
function operations() { document.querySelector("#operations")?.scrollIntoView({ behavior: reduced.matches ? "instant" : "smooth", block: "start" }); }
root.addEventListener("click", event => {
  const button = (event.target as HTMLElement).closest<HTMLElement>("[data-action],[data-view],[data-task]"); if (!button) return;
  if (button.dataset.view) { workspace(button.dataset.view); operations(); return; }
  if (button.dataset.task) { selected = button.dataset.task; const y = scrollY; workspace(); scrollTo(0,y); return; }
  try {
    switch (button.dataset.action) {
      case "theme": {
        const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = theme; localStorage.setItem("cardbot_theme", theme);
        button.textContent = theme === "dark" ? (locale === "zh" ? "◐ 浅色" : "◐ Light") : (locale === "zh" ? "◐ 深色" : "◐ Dark"); break;
      }
      case "language": {
        locale = locale === "zh" ? "en" : "zh";
        localStorage.setItem("cardbot_locale", locale);
        if (currentScreen === "workspace") workspace(currentView);
        else if (currentScreen === "manifesto") manifesto();
        else void entrance();
        break;
      }
      case "workspace": workspace(); scrollTo(0,0); break;
      case "replay": void entrance(); scrollTo(0,0); break;
      case "tasks": workspace("workday"); operations(); break;
      case "morning": case "evening": state.phase = button.dataset.action; save(); workspace("workday"); operations(); break;
      case "generate": if (state.draft.status === "empty") createDraft(state); save(); workspace("drafts"); operations(); break;
      case "approve": if (!document.querySelector<HTMLInputElement>("#review-check")?.checked) throw new Error("请先勾选核对确认，再通过审核。"); approveDraft(state); save(); workspace("drafts"); operations(); toast("人工审核已记录。现在可以保存本地草稿。"); break;
      case "save-draft": saveDraft(state); save(); workspace("drafts"); operations(); toast("本地草稿已保存；未发送，也未写入小满。"); break;
      case "complete": completeTask(state, selected, document.querySelector<HTMLTextAreaElement>("#completion-evidence")!.value); save(); workspace(); operations(); break;
      case "export": {
        const url = URL.createObjectURL(new Blob([JSON.stringify({ kind: "cardbot-fictional-preview", ...state }, null, 2)], { type: "application/json" }));
        const link = document.createElement("a"); link.href = url; link.download = "cardbot-preview.json"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); break;
      }
    }
  } catch (error) { toast(error instanceof Error ? error.message : "操作未完成，请重试。"); }
});
document.addEventListener("keydown", event => { if (event.key === "Escape" && root.querySelector(".hello-screen")) { cancelled = true; manifesto(); } });
window.addEventListener("pagehide", clean);
const query = new URLSearchParams(location.search);
if (query.get("intro") === "1" || !sessionStorage.getItem("cardbot_intro_v2")) void entrance(); else workspace();
