import { randomUUID } from "node:crypto";
import type {
  Todo,
  WorkTaskEvidence,
  WorkTaskSourceRef,
  WorkTaskStatus,
  WorkTaskStatusEvent,
  WorkdayAssignment
} from "./types.js";

export class WorkdayError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 400
  ) {
    super(message);
  }
}

export function workdayDate(value?: string) {
  const date = String(value || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" })).trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/u.test(date) ? new Date(`${date}T12:00:00+08:00`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" }) !== date) {
    throw new WorkdayError("工作日期格式必须为 YYYY-MM-DD", "WORKDAY_DATE_INVALID");
  }
  return date;
}

export function effectiveWorkStatus(todo: Todo): WorkTaskStatus {
  if (todo.done || todo.workStatus === "completed") return "completed";
  if (todo.workStatus) return todo.workStatus;
  if (todo.status === "in_progress") return "in_progress";
  return todo.dueAt ? "pending" : "needs_confirmation";
}

function ensureCollections(todo: Todo) {
  todo.sourceRefs ||= [];
  todo.statusEvents ||= [];
  todo.completionEvidence ||= [];
  todo.workdayAssignments ||= [];
  return todo;
}

export function isAssignedToWorkday(todo: Todo, date: string) {
  return Boolean(todo.workdayAssignments?.some((item) => item.date === date));
}

export function includeTaskInWorkday(todo: Todo, dateValue: string, now = new Date().toISOString()) {
  const date = workdayDate(dateValue);
  ensureCollections(todo);
  const existing = todo.workdayAssignments!.find((item) => item.date === date);
  if (existing) return existing;
  const assignment: WorkdayAssignment = { date, morningIncludedAt: now };
  todo.workdayAssignments!.push(assignment);
  todo.updatedAt = now;
  return assignment;
}

export function ensureMorningWorkday(
  todos: Todo[],
  ownerId: string,
  dateValue: string,
  now = new Date().toISOString()
) {
  const date = workdayDate(dateValue);
  const existing = todos.filter((todo) => todo.ownerId === ownerId && isAssignedToWorkday(todo, date));
  if (existing.length) return existing;
  const eligible = todos.filter((todo) =>
    todo.ownerId === ownerId
    && !todo.historyAt
    && !todo.cancelledAt
    && effectiveWorkStatus(todo) !== "completed"
  );
  eligible.forEach((todo) => includeTaskInWorkday(todo, date, now));
  return eligible;
}

export function markEveningReviewed(
  todos: Todo[],
  ownerId: string,
  dateValue: string,
  now = new Date().toISOString()
) {
  const date = workdayDate(dateValue);
  const assigned = todos.filter((todo) => todo.ownerId === ownerId && isAssignedToWorkday(todo, date));
  for (const todo of assigned) {
    const assignment = todo.workdayAssignments!.find((item) => item.date === date)!;
    assignment.eveningReviewedAt = now;
    todo.updatedAt = now;
  }
  return assigned;
}

export interface WorkTaskTransitionInput {
  status: WorkTaskStatus;
  note?: string;
  blocker?: string;
  nextAction?: string;
  evidence?: Omit<WorkTaskEvidence, "id" | "createdBy" | "createdAt">;
}

export function transitionWorkTask(
  todo: Todo,
  input: WorkTaskTransitionInput,
  actorId: string,
  now = new Date().toISOString()
) {
  ensureCollections(todo);
  const from = effectiveWorkStatus(todo);
  const evidence = input.evidence;
  if (input.status === "completed" && !evidence && !todo.completionEvidence!.length) {
    throw new WorkdayError(
      "任务必须填写完成依据后才能标记为已完成",
      "WORK_TASK_EVIDENCE_REQUIRED",
      409
    );
  }
  if (input.status === "blocked" && (!input.blocker?.trim() || !input.nextAction?.trim())) {
    throw new WorkdayError(
      "受阻任务必须填写缺失条件和下一步行动",
      "WORK_TASK_BLOCKER_DETAILS_REQUIRED"
    );
  }
  if (evidence) {
    todo.completionEvidence!.push({
      ...evidence,
      id: `wte_${randomUUID()}`,
      createdBy: actorId,
      createdAt: now
    });
  }
  const event: WorkTaskStatusEvent = {
    id: `wts_${randomUUID()}`,
    from,
    to: input.status,
    note: input.note?.trim() || "",
    actorId,
    createdAt: now
  };
  todo.statusEvents!.push(event);
  todo.workStatus = input.status;
  todo.blocker = input.status === "blocked" ? input.blocker!.trim() : "";
  if (input.nextAction !== undefined) todo.nextAction = input.nextAction.trim();
  todo.done = input.status === "completed";
  if (todo.done) {
    todo.completedAt = now;
    todo.completedBy = actorId;
    todo.completionResult = evidence?.detail || todo.completionEvidence!.at(-1)?.detail || "";
  } else {
    todo.completedAt = "";
    todo.completedBy = "";
    todo.completionResult = "";
  }
  todo.status = input.status === "in_progress" ? "in_progress" : "pending";
  todo.updatedAt = now;
  return todo;
}

export function appendTaskSource(todo: Todo, source: WorkTaskSourceRef) {
  ensureCollections(todo);
  const duplicate = todo.sourceRefs!.some((item) =>
    item.type === source.type && item.sourceId === source.sourceId
  );
  if (!duplicate) todo.sourceRefs!.push(source);
  return todo;
}

export function buildWorkdaySummary(todos: Todo[], dateValue: string) {
  const date = workdayDate(dateValue);
  const tasks = todos.filter((todo) => isAssignedToWorkday(todo, date));
  const statusCounts: Record<WorkTaskStatus, number> = {
    needs_confirmation: 0,
    pending: 0,
    in_progress: 0,
    awaiting_review: 0,
    completed: 0,
    blocked: 0
  };
  tasks.forEach((todo) => { statusCounts[effectiveWorkStatus(todo)] += 1; });
  const morningTaskIds = tasks.map((todo) => todo.id);
  const reminders = tasks
    .filter((todo) => effectiveWorkStatus(todo) !== "completed")
    .map((todo) => ({
      taskId: todo.id,
      title: todo.title,
      status: effectiveWorkStatus(todo),
      missingCondition: effectiveWorkStatus(todo) === "needs_confirmation"
        ? "任务期限或完成条件待确认"
        : todo.blocker || "尚无可核验的完成依据",
      nextAction: todo.nextAction || "请补充下一步行动"
    }));
  return {
    date,
    morningTaskIds,
    tasks,
    statusCounts,
    total: tasks.length,
    completed: statusCounts.completed,
    unfinished: tasks.length - statusCounts.completed,
    reminders,
    morningCreatedAt: tasks
      .map((todo) => todo.workdayAssignments?.find((item) => item.date === date)?.morningIncludedAt || "")
      .filter(Boolean)
      .sort()[0] || "",
    eveningReviewedAt: tasks
      .map((todo) => todo.workdayAssignments?.find((item) => item.date === date)?.eveningReviewedAt || "")
      .filter(Boolean)
      .sort()
      .at(-1) || ""
  };
}
