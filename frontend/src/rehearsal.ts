import { freshPreview, createDraft, approveDraft, saveDraft, completeTask, type PreviewState } from './preview-store';

export const scenes = [
  { time: '08:00', view: 'workday', zh: '一天，从清晰开始', en: 'Start with a clear day', noteZh: '演练：客户邮件、经理安排、部门协作，汇成 Jojo 的同一批三项任务。', noteEn: 'Simulation: customer email, a manager assignment and a team request become Jojo’s three tasks.' },
  { time: '09:15', view: 'evidence', zh: '先看历史，再做判断', en: 'Read history before replying', noteZh: '找到产品和数量依据；新版价格与交期仍待确认。点击引用可以回看原文。', noteEn: 'Find the product and quantity in the source. Revised pricing and delivery are still unconfirmed. Open each citation.' },
  { time: '09:20', view: 'drafts', zh: '准备一封有依据的回复', en: 'Prepare an evidence-backed reply', noteZh: '预置草稿引用已知事实，不承诺未知价格和交期。此步骤模拟生成，不调用模型。', noteEn: 'The preset reply uses confirmed facts and makes no price or delivery commitment. No model is called.' },
  { time: '09:25', view: 'drafts', zh: '把决定权交给业务员', en: 'Keep the decision with the salesperson', noteZh: '此帧模拟业务员完成审核。实际手动操作仍需勾选核对；修改正文会撤销审核。', noteEn: 'This frame simulates the salesperson’s approval. Manual use requires a review check; editing revokes approval.' },
  { time: '09:26', view: 'outbox', zh: '草稿进入业务员的工作流', en: 'The draft reaches the salesperson’s workflow', noteZh: '展示模拟小满草稿箱与内容读回结果。数据只在演练中，未连接真实小满，也未发送。', noteEn: 'Inspect a simulated OKKI draft box and read-back result. This is rehearsal data, never sent to real OKKI.' },
  { time: '17:30', view: 'workday', zh: '下班前，知道还差什么', en: 'Know what still needs attention', noteZh: '汇总已提交，地址已确认；报价仍缺价格和交期。保存草稿不会把报价任务自动标为完成。', noteEn: 'The report is submitted and the address confirmed. Pricing and delivery still block the quote. Saving a draft does not finish the task.' },
  { time: '17:35', view: 'team', zh: '同一份进度，团队可见', en: 'One shared view of progress', noteZh: '切换到经理视角，读取同一批任务：两项完成、一项待跟进，卡点与个人端一致。', noteEn: 'The manager sees the same tasks: two complete and one blocked, with the same evidence as the personal view.' }
] as const;

// Deterministic snapshots make previous/next/replay reversible. Never persist these
// snapshots over the user's manually edited browser workspace.
export function rehearsalSnapshot(index: number): PreviewState {
  if (!Number.isInteger(index) || index < 0 || index >= scenes.length) throw new Error('Invalid rehearsal scene');
  const state = freshPreview();
  if (index >= 2) createDraft(state);
  if (index >= 3) approveDraft(state);
  if (index >= 4) { saveDraft(state); state.draft.savedAt = '2026-09-12T01:26:00.000Z'; }
  if (index >= 5) {
    completeTask(state, 'TASK-002', 'DEMO REPORT-001 · 11:40 · submitted');
    completeTask(state, 'TASK-003', 'DEMO ADDRESS-003 · 15:10 · confirmed by customer');
    state.phase = 'evening';
  }
  return state;
}

export const mailHistory = [
  { id: 'EMAIL-000', date: '2026-09-10 14:30', from: 'Jojo', subject: 'CB-20 product options', body: 'The CB-20 model is available for your review. The previous quotation has expired; any revised price and delivery date need confirmation.' },
  { id: 'EMAIL-001', date: '2026-09-12 07:45', from: 'Nordic Tools', subject: 'Re: CB-20 inquiry', body: 'Please quote 200 units of model CB-20. Please confirm the updated price and delivery date.' }
];

export type SimulatedReceipt = { kind: 'simulation'; id: string; to: string; subject: string; body: string; savedAt: string };
export function simulatedReceipt(state: PreviewState): SimulatedReceipt {
  if (state.draft.status !== 'saved_local') throw new Error('Review and save the draft first');
  return { kind: 'simulation', id: 'SIM-OKKI-DRAFT-001', to: 'purchasing@nordic-tools.example', subject: 'Re: CB-20 inquiry', body: state.draft.body, savedAt: state.draft.savedAt || '' };
}
