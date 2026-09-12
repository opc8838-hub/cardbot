/** Portable, offline-focused tests. Does not load a business database profile. */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const runner = resolve(root, "node_modules/tsx/dist/cli.mjs");
const env = { ...process.env, CARDBOT_ENV_FILE: resolve(root, "scripts/test.env.example"), NODE_ENV: "test", CRM_STORE: "memory", APP_DATABASE_PROFILE: "test", JWT_SECRET: "cardbot-offline-test-key-not-for-production-2026", OKKI_CONNECTOR_MODE: "mock" };
for (const key of ["DATABASE_URL", "MYSQL_URL", "OKKI_API_TOKEN", "OPENAI_API_KEY", "DEEPSEEK_API_KEY"]) delete env[key];
const tests = [
  "frontend/src/preview-store.test.ts",
  "frontend/src/self-test.ts",
  "backend/src/workday-test.ts",
  "backend/src/workday-http-test.ts",
  "backend/src/email-draft-workflow-test.ts",
  "backend/src/email-evidence-test.ts"
];
for (const test of tests) {
  console.log(`\n[CardBot core] ${test}`);
  const result = spawnSync(process.execPath, [runner, resolve(root, test)], { cwd: root, env, stdio: "inherit" });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("\nCardBot core checks passed. This does not verify live OKKI, SMTP or MySQL.");
