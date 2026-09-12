# 安装、运行、测试与迁移操作手册

## A. 只看新界面（最推荐）

要求：Git、Node.js。当前开发机实测 Node v24.12.0，Windows；CI 配置 Node 24。不需要 DeepSeek Key、小满账号、MySQL 或 Python。

```sh
git clone https://github.com/opc8838-hub/cardbot.git
cd cardbot
npm ci
npm run preview:dev
```

浏览器打开 `http://127.0.0.1:5190/`。保持终端运行；Ctrl+C 停止服务。5190 被占用会明确失败，不悄悄换端口。可以停止自己的旧预览进程，或手动使用 `npm run dev --workspace frontend -- --port 5191 --strictPort` 并按打印的新地址访问。

首次是问候动画，之后为 CARD 功能页，点击 Enter workspace。再次刷新直接到工作台；`/?intro=1` 或 Intro 按钮重播。低动态系统设置下问候停留，用户点击 Skip。

**旧裸 `npm run dev` 不是预览指令**：它会走数据库档位与通信服务，未配环境就可能报错。请先用 `preview:dev`。

## B. 构建可部署文件

```sh
npm run build --workspace frontend
```

产物 `frontend/dist/` 包含新主页、旧 `crm.html` 及 assets。只托管这些文件能展示新预览，不能提供真实 CRM API。Vite `/api` 代理只在开发服务生效；正式部署需要反向代理/后端、HTTPS、鉴权、数据库等。

不要把 `dist/` 当源代码提交，不要把 localhost 地址说成公网地址。当前未配置线上域名或云部署。

## C. 核心测试（无真实小满）

```sh
npm run test:core
```

`scripts/test-core.mjs` 用 Node 子进程传入环境，兼容 Windows，不依赖 shell 的 `NODE_ENV=test command` 写法。测试指定空的 `scripts/test.env.example`，不自动加载个人 `.env`，强制 memory/mock。测试中生成的临时数据不是业务数据。

覆盖新预览领域测试、旧前端 124 检查、workday 领域/HTTP、邮件事实、文件草稿/Mock。不是全量测试，尤其不包含真实 MySQL、WhatsApp、小满和网络模型。

## D. 新预览浏览器验收

安装 Python 3，执行：

```sh
python -m pip install playwright
python -m playwright install chromium
```

一个终端运行 `npm run preview:dev`，另一个运行：

```sh
npm run test:preview-ui
```

默认访问 5190。需要更改时设置 `CARDBOT_PREVIEW_URL`，例如 Windows CMD：

```bat
set CARDBOT_PREVIEW_URL=http://127.0.0.1:5191
npm run test:preview-ui
```

测试会在独立浏览器上下文操作虚构数据，不更改你当前浏览器的数据。截图输出到 `frontend/tests/artifacts/`（已忽略）。不要用旧 `brand_experience_smoke.py` 判断新版；旧脚本仅保留历史参考。

## E. 继续开发真实 CRM

新预览无需后端。真实页面 `/crm.html` 仍调用 4188 的 Express API并要求登录；授权不是凭给 body 加 CSS class 完成。

1. 读 `.env.example` 与 `docs/LEGACY_CRM_REFERENCE.md`，按开发环境建立本地配置。
2. 选择独立的开发 MySQL 库；迁移前确认连接目标、备份及用户权限。不要指向生产/个人业务库。
3. 后端模块目录为 `backend/`；前端目录为 `frontend/`。运行 `npm run dev --workspace backend` 前先设置正确环境。
4. `.env.example` 是占位模板，不是可直接用的凭据。至少确认 DATABASE_URL、CRM_STORE、APP_DATABASE_PROFILE、JWT_SECRET、各加密/游标密钥、CORS_ORIGINS 等。示例以生产档位为模板，开发者必须主动改成正确档位。
5. 当前新端口为 5190，需要把 `http://127.0.0.1:5190` 加入本地 CORS 来源配置；若用反代，遵循实际同源部署规则。
6. 生产系统禁止使用固定演示 JWT、种子密码或 memory 存储。

历史 `backend/cardbot.full.sql` 是开发重建脚本，**包含 DROP DATABASE**；不要直接运行它。优先使用已有迁移脚本，并在执行前确认目标。仓库保留它以便阅读，不表示推荐一键执行。

### Windows 特别说明

部分旧 npm scripts 使用 `CRM_STORE=mysql command`、`PORT=3100 command` 等 POSIX 语法，在 CMD/PowerShell 不通用。本次增加了跨平台预览和核心测试；旧全服务启动脚本尚未全部改造，不能承诺一键全系统安装启动。

可在独立终端先设置必要变量再调用无赋值的脚本。CMD 示例（先准备自己的本地配置）：

```bat
set CARDBOT_ENV_FILE=.env.development.local
npm run dev --workspace backend
```

数据库、账号和真实接口不满足条件时，先停在新预览，不随意创建管理员或导入业务数据。

## F. 可选 WhatsApp 服务

`whatsapp-plugin/` 不属于根 workspaces，具有独立 lockfile。后续需要通信功能时才执行 `npm --prefix whatsapp-plugin ci`，依照其配置与数据库要求操作。本次预览无需启动它。不要因为“整个项目上传”就把登录会话一并提交。

## G. 数据在什么地方

| 内容 | 存储位置 | 换电脑是否随 Git 带走 |
| --- | --- | --- |
| 代码/文档/测试/锁文件 | Git | 是，必须已 commit/push |
| 演示任务/草稿 | 浏览器 localStorage `cardbot_preview_v1` | 否；可点 Export 备份，仅导出，无导入 UI |
| 每个演示账号的 Bot 表情/颜色 | 浏览器 localStorage `cardbot_bot_v1_<accountId>` | 否；只是个人视觉偏好，不含真实账号资料 |
| 主题 | localStorage `cardbot_theme` | 否 |
| 已看过动画 | sessionStorage `cardbot_intro_v2` | 否 |
| 真实 CRM 数据 | 配置的数据库 | 否；需授权备份恢复/共享服务 |
| 后端文件草稿 | `CARDBOT_LOCAL_DRAFT_FILE` 指向的 JSON | 否；按敏感业务数据另行备份 |
| Key、账号、cookie、RPA会话 | 本地配置/秘密管理 | 否；安全渠道另配 |

隐身窗口、换浏览器、清理站点数据会失去本地演示状态。此预览不能当作业务存储使用。

## H. 常见故障

- 空白页：先确认终端报的 URL、Node 版本、`npm ci` 成功；检查浏览器控制台，不要先改业务逻辑。
- 5190 打不开：服务没启动或端口占用；localhost 只能指向当前机器。
- CRM 接口报 401：需要真实登录；新预览免登录不影响 CRM 权限。
- CRM 代理 4188 失败：后端没运行。新预览不依赖该服务。
- 模型/小满显示未就绪：未配置或未经授权，这是预期，不是让你把密钥写进代码。
- npm install 下载失败：检查网络与 registry；不要删除锁文件碰运气。
- Git push 拒绝：先 fetch，看是否远端前进/无权限；不要 force push 覆盖他人提交。
