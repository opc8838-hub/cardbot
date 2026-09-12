import assert from "node:assert/strict";
import { app } from "./server.js";

const server = app.listen(0);
const address = server.address();
if (!address || typeof address === "string") throw new Error("Cannot start workday test server");
const baseUrl = `http://127.0.0.1:${address.port}`;

async function request(path: string, token = "", options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const json = await response.json();
  return { response, json };
}

try {
  const login = await request("/api/auth/login", "", {
    method: "POST",
    body: JSON.stringify({ email: "shirley@cardbot.com", password: "cardbot123" })
  });
  assert.equal(login.response.status, 200);
  const token = login.json.token as string;
  const date = "2030-04-18";
  const sourceId = `mail-http-${Date.now()}`;

  const created = await request("/api/workday/tasks", token, {
    method: "POST",
    body: JSON.stringify({
      title: "根据客户来信准备新版报价草稿",
      priority: "high",
      dueAt: "2030-04-18T15:00",
      completionCriteria: "报价草稿保存并经过人工确认",
      nextAction: "核对历史价格与交期",
      source: {
        type: "customer_email",
        sourceId,
        label: "客户来信",
        excerpt: "请提供新版报价和交期",
        occurredAt: "2030-04-18T00:10:00.000Z"
      }
    })
  });
  assert.equal(created.response.status, 201);
  const taskId = created.json.task.id as string;

  const duplicate = await request("/api/workday/tasks", token, {
    method: "POST",
    body: JSON.stringify({
      title: "重复来源不应重复建任务",
      dueAt: "2030-04-18T15:00",
      completionCriteria: "不重复",
      source: {
        type: "customer_email",
        sourceId,
        label: "同一客户来信",
        excerpt: "相同消息",
        occurredAt: "2030-04-18T00:10:00.000Z"
      }
    })
  });
  assert.equal(duplicate.response.status, 200);
  assert.equal(duplicate.json.created, false);
  assert.equal(duplicate.json.task.id, taskId);

  const morning = await request("/api/workday/morning", token, {
    method: "POST",
    body: JSON.stringify({ date })
  });
  assert.equal(morning.response.status, 200);
  assert.ok(morning.json.summary.morningTaskIds.includes(taskId));
  const morningIds = [...morning.json.summary.morningTaskIds].sort();

  const late = await request("/api/workday/tasks", token, {
    method: "POST",
    body: JSON.stringify({
      title: "午后追加的跨部门任务",
      dueAt: "2030-04-18T17:00",
      completionCriteria: "资料已确认",
      source: {
        type: "cross_department",
        sourceId: `cross-http-${Date.now()}`,
        label: "供应链消息",
        excerpt: "请复核交期",
        occurredAt: "2030-04-18T05:00:00.000Z"
      }
    })
  });
  assert.equal(late.response.status, 201);

  const unchanged = await request(`/api/workday?date=${date}&scope=self`, token);
  assert.deepEqual([...unchanged.json.summary.morningTaskIds].sort(), morningIds);
  assert.ok(!unchanged.json.summary.morningTaskIds.includes(late.json.task.id));

  const missingEvidence = await request(`/api/workday/tasks/${taskId}/status`, token, {
    method: "POST",
    body: JSON.stringify({ status: "completed" })
  });
  assert.equal(missingEvidence.response.status, 409);
  assert.equal(missingEvidence.json.errorCode, "WORK_TASK_EVIDENCE_REQUIRED");

  const completed = await request(`/api/workday/tasks/${taskId}/status`, token, {
    method: "POST",
    body: JSON.stringify({
      status: "completed",
      evidence: { kind: "email_draft", label: "本地邮件草稿", detail: "Draft-2030-0418 已人工复核" }
    })
  });
  assert.equal(completed.response.status, 200);
  assert.equal(completed.json.task.workStatus, "completed");
  assert.equal(completed.json.task.completionEvidence.length, 1);

  const blockedMissingDetails = await request(`/api/workday/tasks/${late.json.task.id}/status`, token, {
    method: "POST",
    body: JSON.stringify({ status: "blocked" })
  });
  assert.equal(blockedMissingDetails.response.status, 400);

  await request(`/api/workday/tasks/${late.json.task.id}/include`, token, {
    method: "POST",
    body: JSON.stringify({ date })
  });
  const blocked = await request(`/api/workday/tasks/${late.json.task.id}/status`, token, {
    method: "POST",
    body: JSON.stringify({ status: "blocked", blocker: "供应链交期未确认", nextAction: "明早联系供应链负责人" })
  });
  assert.equal(blocked.response.status, 200);

  const evening = await request("/api/workday/evening", token, {
    method: "POST",
    body: JSON.stringify({ date })
  });
  assert.equal(evening.response.status, 200);
  assert.ok(evening.json.summary.morningTaskIds.includes(taskId));
  assert.ok(evening.json.summary.morningTaskIds.includes(late.json.task.id));
  assert.ok(evening.json.summary.eveningReviewedAt);
  assert.ok(evening.json.summary.reminders.some((item: { taskId: string; missingCondition: string; nextAction: string }) =>
    item.taskId === late.json.task.id
    && item.missingCondition === "供应链交期未确认"
    && item.nextAction === "明早联系供应链负责人"
  ));

  console.log(JSON.stringify({ ok: true, suite: "workday-http", morningCount: morningIds.length, completedTaskId: taskId }));
} finally {
  server.close();
}
