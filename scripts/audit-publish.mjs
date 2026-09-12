/** Read-only candidate-file audit. Reports paths/line numbers, never secret values. */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding:"utf8" }).split("\0").filter(Boolean))];
const checks = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["github-token", /(?:gh[pousr]_[A-Za-z0-9]{25,}|github_pat_[A-Za-z0-9_]{30,})/],
  ["api-key-shape", /\bsk-[A-Za-z0-9_-]{24,}\b/],
  ["credential-url", /(?:mysql|postgres(?:ql)?):\/\/[^\s:'"/]+:[^\s@'"/]{8,}@/],
  ["legacy-brand", new RegExp("good" + "job", "i")]
];
let hits = 0, bytes = 0;
for (const file of files) {
  let stat; try { stat = statSync(file); } catch { continue; }
  if (!stat.isFile()) continue; bytes += stat.size;
  if (stat.size > 10_000_000) { console.log(`large-file: ${file} (${stat.size})`); hits++; }
  if (/\.(?:jpg|jpeg|png|gif|woff2?|ico|pdf|zip)$/i.test(file)) continue;
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => { for (const [name, pattern] of checks) {
    if (pattern.test(line)) {
      const detail = name === "credential-url" ? line.replace(/((?:mysql|postgres(?:ql)?):\/\/)([^\s:'"/]+):([^\s@'"/]+)@/g, (_all, scheme, _user, password) => `${scheme}<user>:<${/change_me|replace|test|password|example|\$\{/i.test(password) ? "placeholder-or-test" : "REVIEW-SECRET"}>@`) : "";
      console.log(`${name}: ${file}:${index + 1} ${detail.trim()}`); hits++;
    }
  } });
}
console.log(JSON.stringify({ candidateFiles: files.length, totalBytes: bytes, findingsToReview: hits }));
// Findings require human/agent review; false positives in fixtures are expected.
