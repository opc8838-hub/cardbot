/** Isolated, fictional preview data. Never used as CRM or remote-save evidence. */
export type TaskStatus = "open" | "needs_confirmation" | "done";
export type PreviewTask = { id: string; company: string; title: string; source: string; quote: string; deadline: string; status: TaskStatus; missing: string; next: string; evidence: string };
export type PreviewState = { version: 1; batch: string; phase: "morning" | "evening"; tasks: PreviewTask[]; draft: { body: string; status: "empty" | "awaiting_review" | "approved" | "saved_local"; savedAt?: string }; events: string[] };
export const STORAGE_KEY = "cardbot_preview_v1";
export function freshPreview(): PreviewState {
  return {
    version: 1, batch: "DEMO-DAY-001", phase: "morning",
    tasks: [
      { id: "TASK-001", company: "Nordic Tools · Sweden", title: "准备新版报价回复", source: "EMAIL-001 · 客户历史邮件", quote: "Please quote 200 units of model CB-20. Please confirm the updated price and delivery date.", deadline: "今日下班前（演示安排）", status: "needs_confirmation", missing: "新版价格、供应商确认交期", next: "向产品负责人确认价格和交期；草稿不得替代已发送报价。", evidence: "" },
      { id: "TASK-002", company: "内部协作 · Sales team", title: "提交客户跟进汇总", source: "BRIEF-002 · 上级工作安排", quote: "Please submit today's customer follow-up summary before noon.", deadline: "今日 12:00（演示安排）", status: "open", missing: "汇总提交记录", next: "整理跟进情况并记录提交凭据。", evidence: "" },
      { id: "TASK-003", company: "Atlas Studio · United Kingdom", title: "确认样品寄送地址", source: "REQUEST-003 · 跨部门协同", quote: "Please confirm the sample shipping address with the customer. No delivery deadline has been confirmed.", deadline: "待确认", status: "needs_confirmation", missing: "客户确认的完整地址、期限", next: "向客户核对地址；不根据城市猜测街道或邮编。", evidence: "" }
    ],
    draft: { body: "", status: "empty" }, events: ["早间清单已建立 · 同一批 3 项任务"]
  };
}
export function createDraft(state: PreviewState) {
  state.draft = { status: "awaiting_review", body: "Dear Nordic Tools team,\n\nThank you for your inquiry about 200 units of model CB-20. We are checking the updated price and delivery schedule internally and will follow up once these details have been confirmed.\n\nBest regards,\nCardBot demo team" };
  state.events.push("根据 EMAIL-001 模板生成草稿 · 未接模型 · 价格/交期待确认");
}
export function editDraft(state: PreviewState, body: string) {
  state.draft = { body, status: "awaiting_review" };
}
export function approveDraft(state: PreviewState) {
  if (!state.draft.body.trim() || state.draft.status !== "awaiting_review") throw new Error("请先生成草稿并核对原文。");
  state.draft.status = "approved";
  state.events.push("人工审核通过 · 演示用户");
}
export function saveDraft(state: PreviewState) {
  if (state.draft.status !== "approved") throw new Error("必须先人工审核，才能保存。");
  state.draft.status = "saved_local";
  state.draft.savedAt = new Date().toISOString();
  state.events.push("保存至此浏览器本地草稿 · 未写入小满 · 未发送");
}
export function completeTask(state: PreviewState, id: string, evidence: string) {
  const task = state.tasks.find(item => item.id === id);
  if (!task || !evidence.trim()) throw new Error("请填写完成依据，阅读或生成草稿不代表任务完成。");
  task.status = "done"; task.evidence = evidence.trim();
  state.events.push(`${id} 人工确认完成 · ${evidence.trim()}`);
}
export function loadPreview(storage: Storage): PreviewState {
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY) || "null") as PreviewState | null;
    if (data?.version === 1 && data.batch === "DEMO-DAY-001" && data.tasks.length === 3 && data.tasks.every(t => typeof t.id === "string" && typeof t.title === "string" && typeof t.quote === "string") && typeof data.draft.body === "string" && Array.isArray(data.events)) return data;
  } catch { /* Corrupt or unavailable storage: start with a safe fixture. */ }
  return freshPreview();
}
