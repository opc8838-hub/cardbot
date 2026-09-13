import { freshPreview, createDraft, approveDraft, saveDraft, completeTask, type PreviewState } from './preview-store';

export const scenes = [
  { time: '08:00', view: 'prospecting', zh: '先说清楚，什么客户值得找', en: 'Define who is worth finding', noteZh: '从产品、市场和客户类型建立目标客户条件。不是先抓一批邮箱，再倒推谁可能有用。', noteEn: 'Start from product, market and customer type. Do not collect emails first and justify them later.' },
  { time: '08:06', view: 'prospecting', zh: '找到企业，先看匹配度', en: 'Find companies and assess fit', noteZh: '候选企业按业务匹配与公开信号排序；联系方式还不是这一阶段的核心。', noteEn: 'Rank companies by business fit and public signals. Contact data is not the point yet.' },
  { time: '08:12', view: 'prospecting', zh: '回答为什么值得开发、为什么是现在', en: 'Explain why this company, and why now', noteZh: '把企业背景、近期项目和资料来源放在一起，形成可核对的开发判断。', noteEn: 'Combine company context, recent projects and sources into a verifiable qualification decision.' },
  { time: '08:18', view: 'prospecting', zh: '找到对的人，再准备有针对性的沟通', en: 'Find the right person, then prepare the approach', noteZh: '确认负责人和来源，提炼合作切入点；开发信仍然要进入统一草稿审核。', noteEn: 'Record the decision-maker and source, then shape the approach. Outreach still enters the shared review gate.' },
  { time: '09:00', view: 'workday', zh: '新客户和老客户，汇成同一个工作日', en: 'One workday for new and existing customers', noteZh: '开发跟进、客户邮件、经理安排和部门协作，都进入 Jojo 的任务视图。', noteEn: 'Prospecting, customer mail, manager assignments and team requests all enter Jojo’s task view.' },
  { time: '09:15', view: 'evidence', zh: '老客户来信，先看以前谈过什么', en: 'Read history before replying to an existing customer', noteZh: '找到产品和数量依据；新版价格与交期仍待确认。点击引用可以回看原文。', noteEn: 'Find the product and quantity in the source. Revised pricing and delivery remain unconfirmed.' },
  { time: '09:20', view: 'drafts', zh: '判断下一步，再准备有依据的回复', en: 'Decide the next step, then prepare a grounded reply', noteZh: '草稿只使用已知事实，不承诺未知价格和交期。当前内容为预置流程，不调用模型。', noteEn: 'The draft only uses known facts and makes no unconfirmed promise. This preset flow does not call a model.' },
  { time: '09:25', view: 'drafts', zh: '两条业务线，都由业务员确认', en: 'A salesperson approves both business lines', noteZh: '开发信和客户回复共用同一审核门槛；修改正文会撤销已完成的审核。', noteEn: 'Outreach and customer replies share one review gate. Editing revokes prior approval.' },
  { time: '09:26', view: 'outbox', zh: '审核后的草稿，进入统一记录', en: 'Reviewed drafts enter one shared record', noteZh: '展示本地草稿与读回结果。数据未写入真实小满，也没有发送邮件。', noteEn: 'Inspect the local draft and read-back result. Nothing is written to real OKKI or sent.' },
  { time: '17:35', view: 'team', zh: '同一份进度，个人和团队都看得懂', en: 'One progress view for the salesperson and team', noteZh: '经理看到相同的任务、依据和卡点；保存草稿不会自动把业务任务标为完成。', noteEn: 'The manager sees the same tasks, evidence and blockers. Saving a draft does not complete a business task.' }
] as const;

// Deterministic snapshots make previous/next/replay reversible. Never persist these
// snapshots over the user's manually edited browser workspace.
export function rehearsalSnapshot(index: number): PreviewState {
  if (!Number.isInteger(index) || index < 0 || index >= scenes.length) throw new Error('Invalid rehearsal scene');
  const state = freshPreview();
  if (index >= 6) createDraft(state);
  if (index >= 7) approveDraft(state);
  if (index >= 8) { saveDraft(state); state.draft.savedAt = '2026-09-12T01:26:00.000Z'; }
  if (index >= 9) {
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
