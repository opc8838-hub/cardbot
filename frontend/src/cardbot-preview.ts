import "./cardbot-preview.css";
import { mountTextArt } from "./text-art";
import { loadPreview, freshPreview, createDraft, editDraft, approveDraft, saveDraft, completeTask, STORAGE_KEY } from "./preview-store";

const root = document.querySelector<HTMLDivElement>("#cardbot")!;
const state = loadPreview(localStorage);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
let selected = "TASK-001", currentView = "workday", disposeArt = () => {}, clock = 0, cancelled = false;
const names = { open: "进行中", needs_confirmation: "待确认", done: "已完成" };
const draftNames = { empty: "尚未生成", awaiting_review: "待人工审核", approved: "已审核 · 待保存", saved_local: "已保存至本地" };
document.documentElement.dataset.theme = localStorage.getItem("cardbot_theme") === "dark" ? "dark" : "light";
const pill = (label: string, action: string, extra = "") => `<button class="pill ${extra}" data-action="${action}">${label}</button>`;
const themeButton = () => pill(document.documentElement.dataset.theme === "dark" ? "◐ Light" : "◐ Dark", "theme");
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { toast("浏览器未允许存储，请导出备份；刷新后可能丢失。"); } }
function toast(message: string) { const node = document.querySelector<HTMLElement>("#notice"); if (node) { node.textContent = message; node.hidden = false; } }
function clean() { disposeArt(); window.clearInterval(clock); }
function header(section: string) {
  return `<header class="masthead"><a class="wordmark" href="/">cardbot<span>®</span></a><span class="section-label">${section}</span><div class="header-actions">${themeButton()}${pill("Workspace ↗", "workspace")}</div></header>`;
}
async function entrance() {
  clean(); cancelled = false;
  root.innerHTML = `<section class="hello-screen"><div class="intro-top"><span>CARDBOT / GLOBAL TRADE</span>${pill("Skip intro ↗", "skip")}</div><div class="greeting"><span class="hello-dot">•</span><span id="hello-word">Hello</span></div><footer>ONE WORKDAY. EVERY CONVERSATION.<span>01 — WELCOME</span></footer></section>`;
  root.querySelector('[data-action="skip"]')?.addEventListener("click", () => { cancelled = true; manifesto(); });
  const word = document.querySelector<HTMLElement>("#hello-word")!;
  const greetings = [["Hello", "en"], ["你好", "zh-CN"], ["Hola", "es"], ["Bonjour", "fr"], ["مرحباً", "ar"], ["こんにちは", "ja"]];
  const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));
  if (reduced.matches) { word.textContent = "Hello / 你好"; return; }
  await wait(1800);
  for (const [text, lang] of greetings.slice(1)) {
    if (cancelled) return;
    word.classList.add("out"); await wait(400); if (cancelled) return;
    word.textContent = text; word.lang = lang; word.classList.remove("out");
    await wait(1300);
  }
  if (!cancelled) manifesto();
}
function manifesto() {
  clean(); cancelled = true;
  root.innerHTML = `<section class="manifesto">${header("02 / THE WAY WE WORK")}<div class="word-field"><canvas id="card-letters" aria-hidden="true"></canvas><h1 class="capabilities"><span>Evidence</span><span>Workday</span><span>Review</span><span>Draft</span><span>Deliver</span></h1></div><footer class="manifesto-footer"><p>From what was said.<br>To what happens next.</p><div><span class="mono">HISTORY → HUMAN REVIEW → LOCAL DRAFT</span>${pill("Enter workspace ↗", "workspace", "primary")}</div></footer></section>`;
  disposeArt = mountTextArt(document.querySelector<HTMLCanvasElement>("#card-letters")!, "card");
  // Deliberately no timer: readers choose when to leave this typographic page.
}
function workspace(view = currentView) {
  clean(); cancelled = true; currentView = view;
  sessionStorage.setItem("cardbot_intro_v2", "seen");
  const completed = state.tasks.filter(t => t.status === "done").length;
  root.innerHTML = `<div class="workspace-frame">
    <header class="masthead"><a class="wordmark" href="/">cardbot<span>®</span></a><nav aria-label="工作台导航">${[ ["workday", "Workday"], ["evidence", "Evidence"], ["drafts", "Drafts"], ["team", "Team"], ["connections", "Connect"] ].map(([id,label]) => `<button data-view="${id}" class="nav-link ${view === id ? "active" : ""}" ${view === id ? 'aria-current="page"' : ""}>${label}</button>`).join("")}</nav><div class="header-actions">${themeButton()}${pill("↺ Intro", "replay")}</div></header>
    <div class="preview-ribbon"><span><i></i> INTERACTIVE PREVIEW</span><span>虚构演示数据 · 保存在当前浏览器 · 不发送邮件</span><a href="/crm.html?intro=0">真实 CRM 独立入口 ↗</a></div>
    <main class="workspace-main">
      <section class="world-stage" aria-label="全球贸易文字地球">
        <div class="world-heading"><p class="eyebrow">YOUR WORLD. IN ONE WORKDAY.</p><h1>Good morning.<br>Let's move<br><em>work forward.</em></h1><p class="intro-copy">每一次跟进，都有据可依。<br>从早间待办，到晚间复盘。</p><div class="world-actions">${pill("Open today's tasks ↗", "tasks", "primary")}${pill("View evening recap", "evening")}</div></div>
        <div class="earth-wrap"><canvas id="text-earth" tabindex="0" role="img" aria-label="由小字组成大陆的旋转地球；可拖动或用左右方向键旋转"></canvas><span class="earth-cross top">+</span><span class="earth-cross bottom">+</span><span class="earth-foot mono">A WORLD OF CONVERSATIONS<br>DRAG TO EXPLORE / 拖动旋转</span></div>
        <aside class="world-coordinates"><span class="eyebrow">LOCAL TIME / 实时时钟</span><time id="local-time"></time><span id="local-zone" class="mono"></span><hr><label for="city">MARKET / 演示城市</label><select id="city"><option value="Asia/Shanghai">Shanghai · CN</option><option value="Europe/London">London · UK</option><option value="America/New_York">New York · US</option></select><time id="market-time"></time><span id="coordinates" class="mono">31.2304° N / 121.4737° E</span><span class="coordinate-note">城市坐标为预置参考<br>不是客户真实地址</span></aside>
        <div class="world-bottom mono"><span>01 / GLOBAL WORKSPACE</span><span id="rotation">VIEW CENTER / 100° E</span><span>HUMAN IN THE LOOP</span></div>
      </section>
      <section id="operations" class="operations">
        <div class="operation-heading"><div><span class="eyebrow">${state.batch} / ONE SHARED TASK LIST</span><h2>${view === "workday" ? "Your work, in motion." : ({evidence:"Every fact has a source.", drafts:"Draft. Review. Keep.", team:"One team. One truth.", connections:"Connect with confidence."} as Record<string,string>)[view]}</h2></div><div class="phase-switch" aria-label="早晚视图"><button data-action="morning" class="${state.phase === "morning" ? "active" : ""}">早间清单</button><button data-action="evening" class="${state.phase === "evening" ? "active" : ""}">晚间复盘</button></div></div>
        <div class="metrics"><div><span>TODAY'S TASKS</span><strong>03<small>同一批任务</small></strong></div><div><span>COMPLETED</span><strong>0${completed}<small>有完成依据</small></strong></div><div><span>NEEDS FOLLOW-UP</span><strong>0${3-completed}<small>待跟进</small></strong></div><div><span>LOCAL DRAFT</span><strong>${state.draft.status === "saved_local" ? "01" : "00"}<small>不是小满草稿</small></strong></div></div>
        <div id="notice" class="notice" role="status" hidden></div>
        ${view === "connections" ? connectionContent() : view === "drafts" ? draftContent() : view === "team" ? teamContent() : taskContent(view === "evidence")}
      </section>
    </main><footer class="workspace-footer"><span class="wordmark">cardbot.</span><span>Evidence first. Humans always.</span><div>${pill("Export preview data ↓", "export")}</div></footer></div>`;
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
    document.querySelector("#coordinates")!.textContent = ({"Asia/Shanghai":"31.2304° N / 121.4737° E", "Europe/London":"51.5072° N / 0.1276° W", "America/New_York":"40.7128° N / 74.0060° W"} as Record<string,string>)[city];
  };
  updateClock(); clock = window.setInterval(updateClock, 1000);
  root.querySelector("#city")?.addEventListener("change", updateClock);
  root.querySelector("#draft-body")?.addEventListener("input", event => {
    editDraft(state, (event.target as HTMLTextAreaElement).value); save();
    document.querySelector("#draft-status")!.textContent = "内容已修改 · 需重新审核";
    (document.querySelector('[data-action="approve"]') as HTMLButtonElement).disabled = false;
    (document.querySelector('[data-action="save-draft"]') as HTMLButtonElement).disabled = true;
    (document.querySelector("#review-check") as HTMLInputElement).checked = false;
  });
}
function taskContent(evidenceOnly: boolean) {
  const task = state.tasks.find(item => item.id === selected)!;
  return `<div class="task-layout"><div class="task-list"><div class="list-caption"><span>${state.phase === "evening" ? "EVENING / 今日最终状态" : "MORNING / 今日任务"}</span><span>3 ITEMS</span></div>${state.tasks.map((t,index) => `<button class="task-row ${t.id === selected ? "selected" : ""}" data-task="${t.id}" aria-pressed="${t.id === selected}"><span class="task-number">0${index + 1}</span><span><small>${escape(t.company)}</small><strong>${escape(t.title)}</strong><em>${escape(t.deadline)}</em></span><span class="status ${t.status}">${names[t.status]}</span><span class="row-arrow">↗</span></button>`).join("")}<p class="table-note">早晚使用同一份任务状态。生成草稿 ≠ 已发送报价。</p>${state.phase === "evening" ? `<div class="recap"><h3>Before you sign off.</h3>${state.tasks.filter(t => t.status !== "done").map(t => `<p><b>${escape(t.title)}</b><br>缺少：${escape(t.missing)}<br>下一步：${escape(t.next)}</p>`).join("") || "本批任务均已人工确认完成。"}</div>` : ""}</div><article class="detail-panel"><div class="detail-top"><span class="eyebrow">${escape(task.id)} / SOURCE RECORD</span><span>↗</span></div><h3>${escape(task.title)}</h3><p class="source-label">${escape(task.source)}</p><blockquote>${escape(task.quote)}</blockquote><div class="fact-line"><b>已知事实</b><p>${task.id === "TASK-001" ? "客户询问 CB-20，数量 200 件。来自上方 EMAIL-001；没有已确认价格或交期。" : "以上原始安排是本项任务的来源；未提供的内容不得补猜。"}</p></div><div class="fact-line"><b>待确认</b><p>${escape(task.missing)}</p></div>${task.status === "done" ? `<div class="completion-proof"><b>完成依据 · 人工确认</b><p>${escape(task.evidence)}</p></div>` : `<label class="field-label" for="completion-evidence">记录完成依据</label><textarea id="completion-evidence" rows="2" placeholder="例如：已提交汇总，记录编号 REPORT-001"></textarea><div class="detail-actions">${pill("确认完成", "complete")}${task.id === "TASK-001" ? pill("${evidenceOnly ? '查看' : '生成'}回复草稿 ↗".replace("${evidenceOnly ? '查看' : '生成'}", evidenceOnly ? "查看" : "生成"), "generate", "primary") : ""}</div>`}</article></div>`;
}
function draftContent() {
  return `<div class="draft-layout"><article class="detail-panel"><span class="eyebrow">SOURCE / EMAIL-001</span><h3>Facts before fluency.</h3><blockquote>${escape(state.tasks[0].quote)}</blockquote><p>已确认：CB-20 / 200 units。<br>未确认：价格、交期。</p><p class="table-note">此预览用固定模板，不调用 DeepSeek。正文不包含未经确认的价格或交期。</p><p>收件人：purchasing@nordic-tools.example<br>主题：Re: CB-20 inquiry<br><small>保留域名 .example，仅作演示，不会发送。</small></p></article><article class="detail-panel draft-editor"><div class="detail-top"><span class="eyebrow">LOCAL DRAFT / BROWSER ONLY</span><span id="draft-status" class="status">${draftNames[state.draft.status]}</span></div><h3>A considered reply.</h3>${state.draft.status === "empty" ? `<p>先读取历史邮件，再生成待审核草稿。</p>${pill("生成演示草稿 ↗", "generate", "primary")}` : `<label class="field-label" for="draft-body">邮件正文（编辑后必须重新审核）</label><textarea id="draft-body" rows="10">${escape(state.draft.body)}</textarea><label class="review-check"><input type="checkbox" id="review-check"> 我已核对来源、收件人和正文，没有未经确认的业务承诺。</label><div class="detail-actions"><button class="pill" data-action="approve" ${state.draft.status !== "awaiting_review" ? "disabled" : ""}>人工审核通过</button><button class="pill primary" data-action="save-draft" ${state.draft.status !== "approved" ? "disabled" : ""}>保存本地草稿 ↓</button></div>${state.draft.savedAt ? `<p class="save-receipt">LOCAL ONLY · ${escape(state.draft.savedAt)}<br>已保存在当前浏览器。未写入小满，未发送；任务不会自动变成已完成。</p>` : ""}`}</article></div>`;
}
function teamContent() {
  return `<div class="team-layout"><article class="detail-panel"><span class="eyebrow">MANAGER VIEW / DEMO TEAM</span><h3>Same tasks. Shared progress.</h3><p>当前预览只有一位演示业务员。管理汇总直接读取同一批任务，不另造一套完成率。</p>${state.tasks.map(t => `<div class="team-row"><span>${escape(t.id)} · ${escape(t.title)}</span><b>${names[t.status]}</b></div>`).join("")}</article><article class="detail-panel"><span class="eyebrow">ACTIVITY / 本地演示记录</span><h3>The day's trail.</h3><ol class="activity-list">${state.events.map(e => `<li>${escape(e)}</li>`).join("")}</ol><p class="table-note">这是浏览器演示记录，不是服务端不可篡改审计日志。</p></article></div>`;
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
        button.textContent = theme === "dark" ? "◐ Light" : "◐ Dark"; break;
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
