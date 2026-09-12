import assert from "node:assert/strict";
import { assertDatabaseProfile } from "./database-profile.js";

function env(input: Record<string, string>): NodeJS.ProcessEnv {
  return { CRM_STORE: "mysql", ...input };
}

assert.deepEqual(assertDatabaseProfile(env({
  APP_DATABASE_PROFILE: "personal",
  DATABASE_URL: "mysql://user:secret@127.0.0.1/cardbot_personal",
  CRM_SEED_DEVELOPMENT_DATA: "false"
})), { profile: "personal", database: "cardbot_personal" });

assert.deepEqual(assertDatabaseProfile(env({
  APP_DATABASE_PROFILE: "development",
  DATABASE_URL: "mysql://user:secret@127.0.0.1/cardbot_dev",
  CRM_SEED_DEVELOPMENT_DATA: "true"
})), { profile: "development", database: "cardbot_dev" });

assert.deepEqual(assertDatabaseProfile(env({
  APP_DATABASE_PROFILE: "test",
  DATABASE_URL: "mysql://user:secret@127.0.0.1/cardbot_run_test_a1b2c3",
  NODE_ENV: "test"
})), { profile: "test", database: "cardbot_run_test_a1b2c3" });

assert.throws(() => assertDatabaseProfile(env({
  APP_DATABASE_PROFILE: "development",
  DATABASE_URL: "mysql://user:secret@127.0.0.1/cardbot_personal"
})), /开发档位只能连接/u);

assert.throws(() => assertDatabaseProfile(env({
  APP_DATABASE_PROFILE: "personal",
  DATABASE_URL: "mysql://user:secret@127.0.0.1/cardbot_personal",
  CRM_SEED_DEVELOPMENT_DATA: "true"
})), /禁止启用/u);

assert.throws(() => assertDatabaseProfile(env({
  APP_DATABASE_PROFILE: "test",
  DATABASE_URL: "mysql://user:secret@127.0.0.1/cardbot_personal",
  NODE_ENV: "test"
})), /测试档位只能连接/u);

console.log(JSON.stringify({ ok: true, profiles: 3, wrongDatabaseBlocked: true }));

