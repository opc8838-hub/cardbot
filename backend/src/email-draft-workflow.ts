import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OkkiDraftReceipt } from "./okki-connector.js";

export interface HistoricalEmailFact {
  id: string;
  messageId: string;
  field: string;
  value: string;
  quote: string;
  sender: string;
  subject: string;
  sentAt: string;
}

export interface LocalEmailDraft {
  id: string;
  taskId: string;
  customerId: string;
  customerName: string;
  to: string;
  subject: string;
  body: string;
  facts: HistoricalEmailFact[];
  status: "awaiting_review" | "approved" | "rejected" | "saved_local" | "saved_okki";
  reviewNote: string;
  reviewedBy: string;
  reviewedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  okkiReceipt?: OkkiDraftReceipt;
}

interface DraftFile { version: 1; drafts: LocalEmailDraft[] }

export class EmailDraftWorkflowError extends Error {
  constructor(message: string, readonly code: string, readonly status = 400) {
    super(message);
  }
}

export class LocalEmailDraftRepository {
  private loaded = false;
  private drafts: LocalEmailDraft[] = [];

  constructor(private readonly filePath = process.env.CARDBOT_LOCAL_DRAFT_FILE || path.resolve(process.cwd(), "data", "cardbot-local-email-drafts.json")) {}

  private async load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      const data = JSON.parse(await readFile(this.filePath, "utf8")) as DraftFile;
      this.drafts = Array.isArray(data.drafts) ? data.drafts : [];
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
      this.drafts = [];
    }
  }

  private async persist() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify({ version: 1, drafts: this.drafts } satisfies DraftFile, null, 2), "utf8");
    await rename(temporaryPath, this.filePath);
  }

  async list(ownerId: string) {
    await this.load();
    return this.drafts.filter((item) => item.createdBy === ownerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string) {
    await this.load();
    return this.drafts.find((item) => item.id === id);
  }

  async create(input: Omit<LocalEmailDraft, "id" | "status" | "reviewNote" | "reviewedBy" | "reviewedAt" | "createdAt" | "updatedAt">) {
    await this.load();
    if (!input.facts.length || input.facts.some((fact) => !fact.messageId.trim() || !fact.quote.trim() || !fact.value.trim())) {
      throw new EmailDraftWorkflowError("草稿中的事实必须逐条关联历史邮件和原文依据", "EMAIL_DRAFT_FACT_EVIDENCE_REQUIRED", 409);
    }
    const now = new Date().toISOString();
    const draft: LocalEmailDraft = { ...input, id: `maildraft_${randomUUID()}`, status: "awaiting_review", reviewNote: "", reviewedBy: "", reviewedAt: "", createdAt: now, updatedAt: now };
    this.drafts.unshift(draft);
    await this.persist();
    return draft;
  }

  async review(id: string, actorId: string, decision: "approve" | "reject", note = "") {
    const draft = await this.get(id);
    if (!draft) throw new EmailDraftWorkflowError("邮件草稿不存在", "EMAIL_DRAFT_NOT_FOUND", 404);
    if (decision === "reject" && !note.trim()) throw new EmailDraftWorkflowError("驳回草稿时必须填写原因", "EMAIL_DRAFT_REJECTION_NOTE_REQUIRED");
    draft.status = decision === "approve" ? "approved" : "rejected";
    draft.reviewNote = note.trim();
    draft.reviewedBy = actorId;
    draft.reviewedAt = new Date().toISOString();
    draft.updatedAt = draft.reviewedAt;
    await this.persist();
    return draft;
  }

  async markSavedLocal(id: string) {
    const draft = await this.requireApproved(id);
    draft.status = "saved_local";
    draft.updatedAt = new Date().toISOString();
    await this.persist();
    return draft;
  }

  async markSavedOkki(id: string, receipt: OkkiDraftReceipt) {
    const draft = await this.requireApproved(id);
    draft.status = "saved_okki";
    draft.okkiReceipt = receipt;
    draft.updatedAt = new Date().toISOString();
    await this.persist();
    return draft;
  }

  private async requireApproved(id: string) {
    const draft = await this.get(id);
    if (!draft) throw new EmailDraftWorkflowError("邮件草稿不存在", "EMAIL_DRAFT_NOT_FOUND", 404);
    if (!["approved", "saved_local", "saved_okki"].includes(draft.status)) {
      throw new EmailDraftWorkflowError("草稿必须先由人工审核通过，才能保存或推送", "EMAIL_DRAFT_APPROVAL_REQUIRED", 409);
    }
    return draft;
  }
}
