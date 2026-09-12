# 系统架构与开发地图

## 用大白话理解

- 前端是你看到的按钮、任务表和地球。
- 后端负责权限、任务状态、事实记录、审核和外部系统调用。
- 数据库负责跨电脑、跨账号的业务持久化；目前新预览只用本浏览器存储，尚不是这层能力。
- 模型负责理解文字、提出草稿，不负责认定事实，更没有“直接发信”的权限。
- 连接器像统一插座，下面可以接模拟器、官方 API 或浏览器自动化，但三种方式的可信程度不同。
- skills 是给 Agent 的操作约束/专业流程说明，不是装上就能用的 API，也不能替代可执行代码与测试。

## 当前运行结构

```text
浏览器
 ├─ / → Vite 新预览 → preview-store → localStorage（虚构数据）
 │         └─ text-art → world-atlas + Canvas（不请求客户地址）
 └─ /crm.html → 旧 CRM 前端 → /api → Express（需要登录）
                                    ├─ Workday：同批任务 / 权限 / 状态依据
                                    ├─ EML → PostalMime → 事实引用
                                    ├─ 草稿仓储 → JSON 文件（本地）
                                    ├─ OKKI connector → Mock / API骨架 / RPA骨架
                                    ├─ 既有模型运行时（未接新 UI 草稿）
                                    └─ 既有 CRM 存储：memory / MySQL
可选通信服务 whatsapp-plugin：独立依赖/数据库/协议，不是新预览必需项
```

本次有意不取消真实 API 的鉴权。新工作台开放的是隔离的虚构预览，不是给匿名访问者赋予 CRM 用户权限。

## 关键文件

| 文件 | 职责 |
| --- | --- |
| `frontend/index.html` | 新预览默认入口，轻量 HTML |
| `frontend/src/cardbot-preview.ts` | 多语言开场、CARD 品牌页及工作台挂载 |
| `frontend/src/workbench.ts` | 工作台导航、七类业务视图、手动操作与演练播放控制 |
| `frontend/src/workbench.css` | 左侧栏、业务内容、演练控制及响应式布局 |
| `frontend/src/rehearsal.ts` | 七步确定性快照、虚构历史邮件、显式模拟回执 |
| `frontend/src/cardbot-preview.css` | 黑白主题、版式、响应式规范 |
| `frontend/src/preview-store.ts` | 独立演示任务/草稿状态规则 |
| `frontend/src/text-art.ts` | CARD 字形采样与文字地球投影 |
| `frontend/crm.html` | 原完整 CRM 页面，保留独立登录 |
| `frontend/src/prototype-api.ts` | 旧 CRM API 调用与大量页面逻辑 |
| `frontend/src/brand-experience.*` | 上一版旧入口视觉，仅被 CRM 页面加载；不是新预览主实现 |
| `frontend/vite.config.ts` | 两个构建入口与开发反向代理 |
| `backend/src/server.ts` | Express 路由、认证挂载、业务服务组装 |
| `backend/src/workday.ts` | 工作助手状态与早晚汇总 |
| `backend/src/email-evidence.ts` | 原始 EML 解析与证据字段 |
| `backend/src/email-draft-workflow.ts` | 文件草稿仓储与人工审核状态 |
| `backend/src/okki-connector.ts` | 统一 health/saveDraft 接口与三模式 |
| `backend/src/ai-model-runtime.ts` | 多协议模型 HTTP 运行时 |
| `backend/src/auth.ts` | 用户 JWT/cookie/CSRF 等鉴权基础 |
| `agent-skills/`、`agent-knowledge/` | 业务 Agent 的技能与系统契约知识 |

## 真实后端业务接口（不是浏览器预览的调用）

所有下列业务接口需要已认证用户及范围授权；用 cookie 的修改请求还需遵循现有 CSRF 规则。

| 方法与路径 | 作用 |
| --- | --- |
| GET `/api/workday` | 获取工作助手数据 |
| POST `/api/workday/morning` | 建立早间清单 |
| POST `/api/workday/evening` | 晚间核对/提醒 |
| POST `/api/workday/tasks` | 创建工作任务 |
| POST `/api/workday/tasks/:id/status` | 状态更新，具体字段以 server schema 为准 |
| POST `/api/email-evidence/parse` | `rawEml` → 已解析邮件 |
| GET/POST `/api/email-draft-workflows` | 列出/建立关联任务的事实草稿 |
| POST `/api/email-draft-workflows/:id/review` | approve/reject + note |
| POST `/api/email-draft-workflows/:id/deliver` | local/okki 保存路径；真实写权限开启前必须审计 |
| GET `/api/okki/connector/status` | 连接器状态；配置就绪不等于远端验收通过 |

接口与领域细节以源码 Zod schema、类型和测试为准，不把文档表当作可绕过权限的调用说明。

## 数据语义

演练使用 `rehearsalSnapshot(index)` 重建独立状态，不写入手动 `preview-store`。模拟草稿箱回执标记 `kind: simulation`，手动回执单独保存在 `cardbot_simulated_receipt_v1`；修改正文会清除回执。它不调用后端 `OkkiConnector`，不代表端点已完成接入。当前 Jojo 拥有全部三项样例任务，其他演示业务员是空状态。

**任务**：稳定任务 ID、来源、所属人/团队、截止时间是否确定、状态、完成依据。早晚不复制出彼此独立的记录。

**事实**：来源邮件 ID、原文 quote、提取值 value；未来需加来源时间/版本/冲突处理。模型生成的总结本身不能作为事实来源。

**草稿**：待审核 → 人工批准 → 本地保存 →（后续）小满远端写入/复核。三个存储位置必须分别命名：浏览器 localStorage、后端 JSON 文件、小满草稿箱。

**保存回执**：Mock ID 只是模拟；真实远端 receipt 至少需 remote ID、保存时间、目标租户、内容摘要、读回结果。当前 connector 不具备完整远端复核接口。

## 本次技术选择

- 保留 TypeScript/Vite/Express 的现有工程，不另开一套框架；新预览使用清晰的独立入口，避免被巨型旧 CRM 初始化挡住。
- Canvas2D 生成文字地形，`world-atlas/land-110m.json` 提供轮廓，`d3-geo` 判断陆地，`topojson-client` 转换数据。文字地球不是卫星贴图，也不需要外部图像 API。
- CARD 背景将大字绘到离屏画布，再以小词采样其深浅；大小词是两层视觉，不应把前景标题错当背景字形。
- 预览默认无模型费用、无网络业务写入，便于评审 UI；正式业务不能沿用浏览器本地状态作为数据库。
- 地球约 24fps 绘制，离屏/页面隐藏停止有效绘制，限制设备像素比为 2；低动态设置不自动旋转。

## 必须保留的边界

真实模型 Key 只在后端；真实账号不进仓库；预览不能访问客户私密数据；审核拒绝/未审时不允许真实外写；不能用旧 CRM 广泛能力掩盖赛事核心未完成；不能以“展示有按钮”代表接口已工作。
