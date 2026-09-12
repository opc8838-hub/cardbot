import assert from "node:assert/strict";
import { getShanghaiDayPart, getShanghaiGreeting, shanghaiHour } from "./shanghai-greeting";

const cases = [
  ["2026-01-01T21:59:00.000Z", 5, "evening"],
  ["2026-01-01T22:00:00.000Z", 6, "morning"],
  ["2026-01-02T05:59:00.000Z", 13, "morning"],
  ["2026-01-02T06:00:00.000Z", 14, "afternoon"],
  ["2026-01-02T09:59:00.000Z", 17, "afternoon"],
  ["2026-01-02T10:00:00.000Z", 18, "evening"]
] as const;

for (const [iso, hour, part] of cases) {
  const date = new Date(iso);
  assert.equal(shanghaiHour(date), hour, iso);
  assert.equal(getShanghaiDayPart(date), part, iso);
}

assert.equal(getShanghaiGreeting("zh", new Date("2026-01-01T22:00:00.000Z")), "早上好");
assert.equal(getShanghaiGreeting("en", new Date("2026-01-02T06:00:00.000Z")), "Good afternoon");
assert.equal(getShanghaiGreeting("zh", new Date("2026-01-02T10:00:00.000Z")), "晚上好");
console.log("PASS: Shanghai greeting boundaries and bilingual labels");
