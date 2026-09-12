# CardBot

**一套任务贯穿早晚；每封草稿都有依据。** 面向全球贸易的工作助手与销售邮件助手。

仓库：https://github.com/opc8838-hub/cardbot

## 现在能看到什么

2026-09-12 更新：多语言问候 → 小字拼成 CARD 的功能页 → 左侧导航的企业工作台。支持中英文、黑白主题、文字地球与世界时钟、任务与邮件依据、人工审核，以及一键播放七步业务演练。点击“播放演练”，体验假设接入小满后的一天；全部为模拟数据，不调用真实小满或模型。

**务必区分两套入口：**

| 入口 | 用途 | 数据与依赖 |
| --- | --- | --- |
| `/` | 新视觉与核心工作流交互预览 | 虚构数据，浏览器 localStorage；不需要账号、模型、数据库 |
| `/crm.html` | 保留的完整 CRM 原型 | 独立登录，依赖 Express 后端、相应数据库/服务配置 |

新预览不代表真实小满接入。浏览器草稿不等于后端文件草稿，更不等于小满草稿。新界面尚未绑定 CRM API；请看 [当前状态](docs/STATUS.md)。

**旧版界面留底：** [cardbot-visual-v2.html](archives/cardbot-visual-v2.html)。下载该文件后双击打开，无需 Node 或服务器；保留工作台改版前的大号问候、文字地球、横向导航与本地交互。使用方式和版本边界见 [留底说明](archives/README.md)。当前工作台已采用圆角侧栏/主区域及更紧凑的左右留白；不再展示原 CRM 入口链接。

## 三步在另一台电脑运行

安装 Git、Node.js（当前实测 v24.12.0），在终端执行：

```sh
git clone https://github.com/opc8838-hub/cardbot.git
cd cardbot
npm ci
npm run preview:dev
```

打开 **http://127.0.0.1:5190/**。第一次看问候动画；功能页点击“进入工作台”。需要重看动画：访问 `/?intro=1` 或工作台点“开场 / Intro”。

这是你电脑上的本地地址，不是公开网站。GitHub 仓库提供源码，不会自动把系统部署成线上 SaaS。

## 操作体验

1. 总览点击“播放演练”：早间任务 → 历史邮件 → 候选草稿 → 模拟人工审核 → 模拟小满草稿箱 → 晚间核对 → 经理汇总。
2. 支持暂停、继续、上一步、下一步、跳到指定步骤、重播与退出。每步约 7 秒；可以暂停仔细查看。
3. 退出演练后恢复手动工作数据。演练中状态独立，不覆盖原先编辑的草稿或完成依据。
4. 手动模式：在“今日工作”为任务填写完成依据；在“客户与邮件”查历史与引用；在“草稿与审核”编辑、勾选、审核。
5. 可保存本地，或点击“保存到小满 · 模拟”查看虚构草稿箱与模拟回执。支持演示保存失败、保留内容和重新审核。
6. Jojo 拥有邮件、经理安排、部门协作三项任务。Mina/Leo 当前无分配任务；经理看到同一批任务和四人身份映射。
7. 地球、世界时间与品牌开场保留。业务功能切换直接进入内容，不重复滚过品牌首屏。

身份切换只是前端架构 Demo，用虚构 `OKKI USER ID` 说明未来映射方式；它不是生产登录、服务端权限或真实小满授权。

## 接手文档导航

| 你想知道 | 读这里 |
| --- | --- |
| 做好了什么、缺什么、测试结果 | [STATUS](docs/STATUS.md) |
| 赛事目标、约束、验收与演示脚本 | [COMPETITION](docs/COMPETITION.md) |
| 无 API 时如何播放、操作和讲解演练 | [DEMO_PLAYBOOK](docs/DEMO_PLAYBOOK.md) |
| 系统怎么运行、关键代码在哪 | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| 如何安装、启动、测试、配置环境 | [RUNBOOK](docs/RUNBOOK.md) |
| 模型、小满、邮箱需要什么 | [INTEGRATIONS](docs/INTEGRATIONS.md) |
| 小满最终怎么打通、还缺哪些授权 | [OKKI 接入计划](docs/OKKI_INTEGRATION_PLAN.md) |
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
