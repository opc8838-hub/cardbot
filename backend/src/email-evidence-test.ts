import assert from "node:assert/strict";
import { parseEmailEvidence } from "./email-evidence.js";

const raw = [
  "From: Nordic Buyer <buyer@nordic.example>",
  "To: Shirley <shirley@cardbot.com>",
  "Subject: Re: Updated quotation",
  "Date: Thu, 10 Sep 2026 16:00:00 +0800",
  "Message-ID: <mail-2030-1@nordic.example>",
  "MIME-Version: 1.0",
  "Content-Type: text/plain; charset=utf-8",
  "",
  "Please quote 500 units under FOB Shanghai.",
  "Our acceptable lead time is 21 days.",
  "Please attach the CE certificate."
].join("\r\n");

const parsed = await parseEmailEvidence(raw);
assert.equal(parsed.messageId, "mail-2030-1@nordic.example");
assert.equal(parsed.sender, "buyer@nordic.example");
assert.equal(parsed.subject, "Re: Updated quotation");
assert.ok(parsed.quoteCandidates.includes("Please quote 500 units under FOB Shanghai."));
assert.ok(parsed.quoteCandidates.includes("Our acceptable lead time is 21 days."));
assert.match(parsed.contentHash, /^[a-f0-9]{64}$/u);
console.log(JSON.stringify({ ok: true, suite: "email-evidence", messageId: parsed.messageId, quotes: parsed.quoteCandidates.length }));
