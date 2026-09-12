# CardBot

**一套任务贯穿早晚；每封草稿都有依据。** 面向全球贸易的工作助手与销售邮件助手。

仓库：https://github.com/opc8838-hub/cardbot

## 现在能看到什么

2026-09-12 交付：慢节奏多语言问候 → 小字拼成 CARD 的功能页 → 无需登录的交互工作台。支持浅色/深色、文字大陆地球、实时时钟、早晚同批任务、查看邮件来源、人工确认完成、审核与本地草稿、管理汇总。

**务必区分两套入口：**

| 入口 | 用途 | 数据与依赖 |
| --- | --- | --- |
| `/` | 新视觉与核心工作流交互预览 | 虚构数据，浏览器 localStorage；不需要账号、模型、数据库 |
| `/crm.html` | 保留的完整 CRM 原型 | 独立登录，依赖 Express 后端、相应数据库/服务配置 |

新预览不代表真实小满接入。浏览器草稿不等于后端文件草稿，更不等于小满草稿。新界面尚未绑定 CRM API；请看 [当前状态](docs/STATUS.md)。

## 三步在另一台电脑运行

安装 Git、Node.js（当前实测 v24.12.0），在终端执行：

```sh
git clone https://github.com/opc8838-hub/cardbot.git
cd cardbot
npm ci
npm run preview:dev
```

打开 **http://127.0.0.1:5190/**。第一次看问候动画；功能页点击 `Enter workspace`。需要重看动画：访问 `/?intro=1` 或工作台点 `Intro`。

这是你电脑上的本地地址，不是公开网站。GitHub 仓库提供源码，不会自动把系统部署成线上 SaaS。

## 操作体验

1. Workday 查看三项虚构任务和来源；点任务查看英文邮件原文。
2. 为“提交客户跟进汇总”填完成依据，再确认完成。
3. 切换晚间复盘：同一批任务继续存在，未完成任务显示缺少什么、下一步做什么。
4. 为报价任务生成回复草稿；核对原文，勾选人工审核，再保存本地。
5. 刷新后能找回本浏览器草稿；编辑正文会撤销审核，必须重新审核。
6. Team 汇总与个人视图共用同一份状态；Connect 明确显示哪些接入尚未完成。

## 接手文档导航

| 你想知道 | 读这里 |
| --- | --- |
| 做好了什么、缺什么、测试结果 | [STATUS](docs/STATUS.md) |
| 赛事目标、约束、验收与演示脚本 | [COMPETITION](docs/COMPETITION.md) |
| 系统怎么运行、关键代码在哪 | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| 如何安装、启动、测试、配置环境 | [RUNBOOK](docs/RUNBOOK.md) |
| 模型、小满、邮箱需要什么 | [INTEGRATIONS](docs/INTEGRATIONS.md) |
| 为什么这样做、下阶段顺序 | [ROADMAP](docs/ROADMAP.md) |
| 换电脑/账号后怎么同步接着做 | [HANDOFF](docs/HANDOFF.md) |
| 字体、圆角、动画、地球设计规范 | [前端规范](FRONTEND_DESIGN_SPEC.md) |
| 原有 CRM 的更广泛能力与旧配置 | [历史 CRM 参考](docs/LEGACY_CRM_REFERENCE.md) |

给下一位开发者或 AI：先读 `AGENTS.md`、`docs/STATUS.md`、`docs/HANDOFF.md`，再改代码。不要只读旧计划就判断已完成。

## 测试

```sh
npm run test:core
npm run build --workspace frontend
```

浏览器测试需额外安装 Python Playwright，保持预览服务运行，然后 `npm run test:preview-ui`。完整步骤见 RUNBOOK。

## 数据与授权

源码、锁文件、说明、测试同步到 Git。真实账号、密钥、邮件、数据库、浏览器登录会话、管理员账号说明不进入 Git；换电脑需通过安全渠道单独配置。演示记录只在当前浏览器，不自动跨电脑同步。

本项目不允许 AI 未经人工审核直接对外发信。可展示本地与 Mock 阶段成果，但不能宣称小满真实验收已通过。

原始代码遵循仓库 LICENSE；第三方保留各自许可。通信服务包含不同许可依赖，参见 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md)、`LICENSES/` 与 `whatsapp-plugin/`，不可统一宣称全部都是 MIT 或 Apache。
