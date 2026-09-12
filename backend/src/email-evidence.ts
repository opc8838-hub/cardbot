import { createHash } from "node:crypto";
import PostalMime, { type Address, type Mailbox } from "postal-mime";

export interface ParsedEmailEvidence {
  messageId: string;
  contentHash: string;
  sender: string;
  senderName: string;
  subject: string;
  sentAt: string;
  text: string;
  quoteCandidates: string[];
  attachments: Array<{ filename: string; mimeType: string; size: number }>;
}

function mailbox(address?: Address): Mailbox | undefined {
  if (!address) return undefined;
  if ("group" in address && address.group) return address.group[0];
  return address as Mailbox;
}

function normalizedText(value: string) {
  return value.replace(/\r\n?/gu, "\n").replace(/[ \t]+/gu, " ").replace(/\n{3,}/gu, "\n\n").trim();
}

function quoteCandidates(text: string) {
  const candidates = text
    .split(/\n+|(?<=[。！？.!?])\s+/u)
    .map((item) => item.replace(/^>+/u, "").trim())
    .filter((item) => item.length >= 8 && item.length <= 500)
    .filter((item) => !/^(from|sent|to|subject|发件人|发送时间|收件人|主题)\s*[:：]/iu.test(item));
  return [...new Set(candidates)].slice(0, 50);
}

export async function parseEmailEvidence(rawEml: string): Promise<ParsedEmailEvidence> {
  if (!rawEml.trim()) throw new Error("邮件原文不能为空");
  if (Buffer.byteLength(rawEml, "utf8") > 2_000_000) throw new Error("单封邮件不能超过 2MB");
  const parsed = await PostalMime.parse(rawEml, { attachmentEncoding: "arraybuffer", maxNestingDepth: 40, maxHeadersSize: 256_000, maxRfc822NestingDepth: 3 });
  const text = normalizedText(parsed.text || "");
  const hash = createHash("sha256").update(rawEml).digest("hex");
  const from = mailbox(parsed.from);
  return {
    messageId: String(parsed.messageId || `eml_${hash.slice(0, 24)}`).replace(/[<>]/gu, ""),
    contentHash: hash,
    sender: from?.address || "",
    senderName: from?.name || "",
    subject: parsed.subject || "(无主题)",
    sentAt: parsed.date || "",
    text,
    quoteCandidates: quoteCandidates(text),
    attachments: parsed.attachments.map((item) => ({
      filename: item.filename || "未命名附件",
      mimeType: item.mimeType || "application/octet-stream",
      size: typeof item.content === "string" ? Buffer.byteLength(item.content) : item.content.byteLength
    }))
  };
}
