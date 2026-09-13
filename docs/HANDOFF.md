# 换电脑、换账号与下一位开发者交接

## 从哪里开始

1. 拉取 `https://github.com/opc8838-hub/cardbot`，不要从聊天截图重建项目。
2. 读 README → STATUS → COMPETITION → ARCHITECTURE → 本文件。
3. `npm ci`，`npm run preview:dev`，先确认能够看到 5190 的新预览。
4. `npm run test:core`，确认基础没有回归，再动手。
5. 对照 ROADMAP 只做下一条已授权任务，外部付费调用/生产写入需单独明确范围。

## 可以复制给新 AI/开发者的提示

> 这是 CardBot 的现有项目。请先完整读 AGENTS.md、docs/STATUS.md、docs/HANDOFF.md，并检查 git status。用户要全球贸易工作助手与销售邮件助手的闭环，当前新 UI 在 `/`、真实 CRM 在 `/crm.html`。新预览是虚构 localStorage 数据，不等于后端或真实小满。先保留已有实现和改动，不重写项目；报告你读到的当前阶段、已验证项和下一步缺口，再根据我的新任务开发。密钥/账号不能进 Git；不要把 Mock/本地稿称为小满保存成功。提交时同步更新文档和测试结论。

## 日常同步纪律

开始前：

```sh
git status
git fetch origin
git pull --ff-only
```

有未提交改动时先检查、提交或安全备份自己的改动，不用 reset --hard。远端发生分叉时停下来理解冲突，不 force push。可在功能分支开发：`git switch -c feature/描述`（名称按实际任务取）。

结束时：

1. 跑本次相关测试，记录命令、结果、未测项。
2. 更新 STATUS（完成度/验证）、ROADMAP（下一步/决策）、RUNBOOK（命令变化）、相关接口/设计文档。
3. `git diff --check`、`git diff`，检查没有密钥、真实客户数据或生成垃圾。
4. 将确认范围的文件 stage，commit，push；再确认本地 HEAD 与远端一致。
5. GitHub 上能读到最新 README 和状态文档，另一台电脑才算能接手。仅保存文件未 commit/push 不算同步。

## 哪些不能靠 Git 同步

Git 只同步版本化文件，不同步浏览器数据、运行进程、数据库、登录状态、密钥或模型额度。新电脑启动 localhost 是另一份本地环境；需要多人同一数据时要共用受控后端/数据库，而不是把数据库备份放 Git。

已忽略：`.env*`（示例除外）、node_modules、dist、日志、数据库/会话文件、本地业务草稿、截图产物、管理员账号说明、个人业务表格。这些本地文件没有被删除，只是不上传。需要真实业务迁移时，通过加密备份与最小权限渠道单独办理。

不同 GitHub 账号需要仓库写权限与各自登录凭证。换了 AI 账号不自动获得 GitHub、模型或小满权限；不要共享 token 到聊天/文档里。

## 保持“所有信息同步”的实际规则

| 信息 | 唯一主位置 |
| --- | --- |
| 当前阶段、测试证据、缺口 | docs/STATUS.md |
| 用户确认目标与下一步思考 | docs/ROADMAP.md |
| 赛事硬约束与演示方式 | docs/COMPETITION.md |
| 接口与外部凭证需求（不含秘密） | docs/INTEGRATIONS.md |
| 运行方式与数据边界 | docs/RUNBOOK.md |
| 前端设计规范 | FRONTEND_DESIGN_SPEC.md |
| 原始实现细节 | 代码/类型/测试，与文档发生差异时先核实 |

历史计划和 DESIGN_V1_ARCHIVE 只能看背景；不要让它们覆盖新决策。每次重大判断记录“为什么/代价/验收条件”，避免下一位重复争论。

## 下一步最值得做的事

先用 docs/DEMO_PLAYBOOK.md 播放新工作台的七步演练，确认企业理解预期流程。当前只是模拟接入，不能宣称后端、模型、小满已经连通。技术上推进 ROADMAP P1 的后端数据绑定和外写安全校验，同时确认企业邮件 API 或 RPA 的授权范围。工作台主入口改在 workbench.ts，cardbot-preview.ts 只负责品牌开场；不要再修改已不使用的旧预览页面函数。

入口卡牌片当前唯一视频资源为 `frontend/public/assets/cardbot-cards-intro.mp4`（1920×1080、3.4 秒），有声音轨为 `frontend/public/assets/cardbot-intro-score.m4a`（AAC-LC、44.1kHz 立体声、9.217 秒）；旧 WebM 已移除。完整入口固定为问候 4.8 秒 + 卡牌片 3.4 秒 + 翻卡 1.8 秒 = 10 秒，运行时从 `frontend/motion/cardbot-entry/build/timeline.json` 读取参数。浏览器禁止首屏有声自动播放时必须保留当前的静音回退和按当前秒数恢复机制，不得伪装成正在播放。视频尾帧与登录首帧的取样和说明在 `frontend/motion/cardbot-entry/qa/`；起始黑卡必须保持当前外轮廓、倾斜和眼睛比例，不得重新缩回旧的 0.338 比例。演练焦点由 `workbench.ts` 的 `tourFocusSelectors` 映射十步核心区域；前四步为客户开发，后六步为现有客户、统一审核与团队汇总。新增页面或调整结构时要同步选择器与浏览器断言，避免演讲时高亮丢失。

客户开发 Demo 的虚构数据与本地状态集中在 `frontend/src/prospecting-demo.ts`。它通过 `draftMode` 进入工作台原有“草稿与审核 / 草稿记录”，用于证明两条业务线可以共用机制；真实上线应以适配层连接已有后端获客、验证、外联资格与草稿领域服务，不得直接把 localStorage 结构当 API 契约。

工作台空闲屏保由 `frontend/src/idle-screensaver.ts` 独立管理，固定 20 秒触发；视觉使用现有 `mountTextArt(..., 'earth')` 并复刻 `archives/cardbot-visual-v2.html` 的工作日首屏结构，没有嵌入或运行旧业务代码。顶部纯图形按钮使用独立 `screensaver` 动作，直接调用同一屏保控制器，禁止接入 `tour-*` 业务演练状态机。屏保显示后 `pointermove` 必须保持画面，`pointerdown` 才退出；后续修改全局事件或销毁流程时，必须复测退出动作不会继续传给底层页面。

公开展示由 `.github/workflows/pages.yml` 发布：当前 Vite Demo 位于 `https://opc8838-hub.github.io/cardbot/`，旧版离线 HTML 位于其 `/archives/cardbot-visual-v2.html`。`frontend/vite.config.ts` 的相对 `base` 与 `cardbot-preview.ts` 的 `import.meta.env.BASE_URL` 是 GitHub Pages 子路径兼容所必需，改回根路径会导致卡牌 MP4 或首页链接失效。Pages 是纯静态展示，不要把 `/crm.html`、后端 API 或任何外部连接器标为已上线。
