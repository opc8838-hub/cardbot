import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { EmailDraftWorkflowError, LocalEmailDraftRepository } from "./email-draft-workflow.js";
import { MockOkkiConnector, OkkiConnectorError, PlaywrightRpaOkkiConnector } from "./okki-connector.js";

const directory = await mkdtemp(path.join(os.tmpdir(), "cardbot-draft-test-"));
const filePath = path.join(directory, "drafts.json");

try {
  const repository = new LocalEmailDraftRepository(filePath);
  await assert.rejects(
    () => repository.create({
      taskId: "task_1", customerId: "customer_1", customerName: "Nordic Tools", to: "buyer@example.com",
      subject: "Updated quotation", body: "Please review.", facts: [], createdBy: "sales_1"
    }),
    (error) => error instanceof EmailDraftWorkflowError && error.code === "EMAIL_DRAFT_FACT_EVIDENCE_REQUIRED"
  );

  const draft = await repository.create({
    taskId: "task_1",
    customerId: "customer_1",
    customerName: "Nordic Tools",
    to: "buyer@example.com",
    subject: "Updated quotation and lead time",
    body: "Based on our previous exchange, attached is the updated quotation.",
    facts: [{
      id: "fact_1", messageId: "message_1", field: "lead_time", value: "21 days",
      quote: "Our acceptable lead time is 21 days.", sender: "buyer@example.com",
      subject: "Re: quotation", sentAt: "2026-09-10T08:00:00.000Z"
    }],
    createdBy: "sales_1"
  });
  assert.equal(draft.status, "awaiting_review");
  await assert.rejects(() => repository.markSavedLocal(draft.id), (error) => error instanceof EmailDraftWorkflowError && error.code === "EMAIL_DRAFT_APPROVAL_REQUIRED");
  await assert.rejects(() => repository.review(draft.id, "manager_1", "reject"), (error) => error instanceof EmailDraftWorkflowError && error.code === "EMAIL_DRAFT_REJECTION_NOTE_REQUIRED");
  await repository.review(draft.id, "manager_1", "approve", "事实与措辞已核对");
  const saved = await repository.markSavedLocal(draft.id);
  assert.equal(saved.status, "saved_local");

  const mock = new MockOkkiConnector();
  assert.equal((await mock.health()).ready, true);
  const receipt = await mock.saveDraft({ localDraftId: draft.id, to: draft.to, subject: draft.subject, body: draft.body });
  assert.equal(receipt.connector, "mock");
  assert.match(receipt.remoteDraftId, /^okki_mock_/u);

  const rpa = new PlaywrightRpaOkkiConnector();
  assert.equal((await rpa.health()).ready, false);
  await assert.rejects(
    () => rpa.saveDraft({ localDraftId: draft.id, to: draft.to, subject: draft.subject, body: draft.body }),
    (error) => error instanceof OkkiConnectorError && error.code === "OKKI_RPA_ACCOUNT_REQUIRED"
  );

  const reloaded = new LocalEmailDraftRepository(filePath);
  assert.equal((await reloaded.list("sales_1"))[0]?.status, "saved_local");
  console.log(JSON.stringify({ ok: true, suite: "email-draft-workflow", draftId: draft.id, mockDraftId: receipt.remoteDraftId }));
} finally {
  await rm(directory, { recursive: true, force: true });
}
