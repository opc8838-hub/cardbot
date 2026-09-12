import assert from "node:assert/strict";
import type { Todo } from "./types.js";
import {
  buildWorkdaySummary,
  ensureMorningWorkday,
  includeTaskInWorkday,
  markEveningReviewed,
  transitionWorkTask,
  WorkdayError
} from "./workday.js";

const todos: Todo[] = [
  {
    id: "task_email",
    title: "回复客户报价邮件",
    type: "customer",
    priority: "high",
    dueAt: "2026-09-11T17:00",
    ownerId: "sales_1",
    teamId: "team_1",
    related: "Nordic Tools AB",
    done: false,
    workStatus: "pending",
    sourceRefs: [{ id: "source_1", type: "customer_email", sourceId: "mail_1", label: "客户来信", excerpt: "请在今天提供新版报价", occurredAt: "2026-09-11T08:00:00.000Z" }],
    statusEvents: [],
    completionEvidence: [],
    workdayAssignments: [],
    completionCriteria: "新版报价通过人工审核",
    nextAction: "确认价格"
  }
];

const morning = ensureMorningWorkday(todos, "sales_1", "2026-09-11", "2026-09-11T08:00:00.000Z");
assert.deepEqual(morning.map((item) => item.id), ["task_email"]);

todos.push({
  id: "task_late",
  title: "午后新增任务",
  type: "other",
  priority: "normal",
  dueAt: "2026-09-11T18:00",
  ownerId: "sales_1",
  teamId: "team_1",
  related: "",
  done: false
});
assert.deepEqual(
  ensureMorningWorkday(todos, "sales_1", "2026-09-11").map((item) => item.id),
  ["task_email"],
  "重复生成早间清单时不得把午后新增任务悄悄混入原批次"
);

assert.throws(
  () => transitionWorkTask(todos[0]!, { status: "completed" }, "sales_1"),
  (error) => error instanceof WorkdayError && error.code === "WORK_TASK_EVIDENCE_REQUIRED"
);

transitionWorkTask(todos[0]!, {
  status: "completed",
  note: "报价已经由主管审核",
  evidence: {
    kind: "document",
    label: "报价审核记录",
    detail: "报价单 Q-2026-0911 已审核",
    sourceId: "Q-2026-0911"
  }
}, "sales_1", "2026-09-11T16:30:00.000Z");

includeTaskInWorkday(todos[1]!, "2026-09-11", "2026-09-11T13:00:00.000Z");
transitionWorkTask(todos[1]!, {
  status: "blocked",
  blocker: "等待技术部确认参数",
  nextAction: "明早催技术部回复"
}, "sales_1", "2026-09-11T17:00:00.000Z");
markEveningReviewed(todos, "sales_1", "2026-09-11", "2026-09-11T18:00:00.000Z");

const evening = buildWorkdaySummary(todos, "2026-09-11");
assert.deepEqual(evening.morningTaskIds, ["task_email", "task_late"]);
assert.equal(evening.completed, 1);
assert.equal(evening.unfinished, 1);
assert.equal(evening.reminders[0]?.missingCondition, "等待技术部确认参数");
assert.equal(evening.reminders[0]?.nextAction, "明早催技术部回复");
assert.equal(evening.eveningReviewedAt, "2026-09-11T18:00:00.000Z");

console.log(JSON.stringify({ ok: true, suite: "workday", taskIds: evening.morningTaskIds }));
