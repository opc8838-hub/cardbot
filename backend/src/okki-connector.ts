import { randomUUID } from "node:crypto";

export type OkkiConnectorMode = "mock" | "official_api" | "playwright_rpa";

export interface OkkiDraftInput {
  localDraftId: string;
  to: string;
  subject: string;
  body: string;
  customerName?: string;
}

export interface OkkiDraftReceipt {
  connector: OkkiConnectorMode;
  remoteDraftId: string;
  savedAt: string;
  reviewLocation: string;
}

export interface OkkiConnector {
  readonly mode: OkkiConnectorMode;
  health(): Promise<{ ready: boolean; message: string }>;
  saveDraft(input: OkkiDraftInput): Promise<OkkiDraftReceipt>;
}

export class OkkiConnectorError extends Error {
  constructor(message: string, readonly code: string, readonly status = 503) {
    super(message);
  }
}

export class MockOkkiConnector implements OkkiConnector {
  readonly mode = "mock" as const;

  async health() {
    return { ready: true, message: "Mock 连接器可用，不会访问真实小满账号" };
  }

  async saveDraft(input: OkkiDraftInput): Promise<OkkiDraftReceipt> {
    return {
      connector: this.mode,
      remoteDraftId: `okki_mock_${randomUUID()}`,
      savedAt: new Date().toISOString(),
      reviewLocation: `mock://okki/drafts/${encodeURIComponent(input.localDraftId)}`
    };
  }
}

export class OfficialApiOkkiConnector implements OkkiConnector {
  readonly mode = "official_api" as const;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly draftPath: string
  ) {}

  async health() {
    const ready = Boolean(this.baseUrl && this.token && this.draftPath);
    return {
      ready,
      message: ready ? "官方 API 参数已配置" : "等待主办方确认官方 API 地址、鉴权方式和草稿接口"
    };
  }

  async saveDraft(input: OkkiDraftInput): Promise<OkkiDraftReceipt> {
    const health = await this.health();
    if (!health.ready) throw new OkkiConnectorError(health.message, "OKKI_OFFICIAL_API_NOT_CONFIGURED");
    const response = await fetch(new URL(this.draftPath, this.baseUrl), {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify({ to: input.to, subject: input.subject, body: input.body, customerName: input.customerName })
    });
    if (!response.ok) throw new OkkiConnectorError(`小满官方 API 保存草稿失败（HTTP ${response.status}）`, "OKKI_OFFICIAL_API_FAILED", 502);
    const result = await response.json() as Record<string, unknown>;
    const remoteDraftId = String(result.id || result.draftId || "").trim();
    if (!remoteDraftId) throw new OkkiConnectorError("小满官方 API 未返回草稿编号", "OKKI_OFFICIAL_API_INVALID_RESPONSE", 502);
    return { connector: this.mode, remoteDraftId, savedAt: new Date().toISOString(), reviewLocation: String(result.url || "小满草稿箱") };
  }
}

export interface OkkiRpaDriver {
  health(): Promise<{ ready: boolean; message: string }>;
  saveDraft(input: OkkiDraftInput): Promise<{ remoteDraftId: string; reviewLocation?: string }>;
}

export class PlaywrightRpaOkkiConnector implements OkkiConnector {
  readonly mode = "playwright_rpa" as const;

  constructor(private readonly driver?: OkkiRpaDriver) {}

  async health() {
    return this.driver?.health() || Promise.resolve({ ready: false, message: "等待测试账号后完成登录定位和草稿箱页面校准" });
  }

  async saveDraft(input: OkkiDraftInput): Promise<OkkiDraftReceipt> {
    if (!this.driver) throw new OkkiConnectorError("Playwright RPA 已预留，但需要测试账号后校准页面", "OKKI_RPA_ACCOUNT_REQUIRED");
    const result = await this.driver.saveDraft(input);
    return {
      connector: this.mode,
      remoteDraftId: result.remoteDraftId,
      savedAt: new Date().toISOString(),
      reviewLocation: result.reviewLocation || "小满草稿箱"
    };
  }
}

export function createOkkiConnector(mode: OkkiConnectorMode, driver?: OkkiRpaDriver): OkkiConnector {
  if (mode === "official_api") {
    return new OfficialApiOkkiConnector(
      process.env.OKKI_API_BASE_URL || "",
      process.env.OKKI_API_TOKEN || "",
      process.env.OKKI_DRAFT_API_PATH || ""
    );
  }
  if (mode === "playwright_rpa") return new PlaywrightRpaOkkiConnector(driver);
  return new MockOkkiConnector();
}

export function configuredOkkiMode(): OkkiConnectorMode {
  const value = String(process.env.OKKI_CONNECTOR_MODE || "mock").trim();
  return value === "official_api" || value === "playwright_rpa" ? value : "mock";
}
