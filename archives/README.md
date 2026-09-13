# 旧版界面留底

`cardbot-visual-v2.html` 是工作台重构之前的视觉版本，来源提交 `c3caa2fcdca0f7959df4c064ad6cc8519519627c`。不是把当前工作台另存一份，也不是截图。

- 公开浏览：<https://opc8838-hub.github.io/cardbot/archives/cardbot-visual-v2.html>
- GitHub 源文件：<https://github.com/opc8838-hub/cardbot/blob/main/archives/cardbot-visual-v2.html>
- 当前新版 Demo：<https://opc8838-hub.github.io/cardbot/>

GitHub Pages 部署会把本目录的 HTML 原样复制到公开站点的 `archives/` 路径。旧版与新版分别保留，后续新版开发不会覆盖这个文件。

## 怎么看

可以直接打开上面的公开链接；也可以下载 HTML 后双击，用 Chrome、Edge 等现代浏览器离线打开。只复制这一个文件到另一台电脑即可，无需服务器、Node、数据库或任何 API。GitHub 文件页通常先显示源码，需要下载后再离线打开。

保留多语言 Hello 开场、CARD 功能页、大号问候与文字地球首屏、旧横向导航、中英文/黑白主题、虚构任务、本地审核与草稿。动画、样式、JavaScript 和陆地数据全部内嵌。开启系统“减少动态效果”时需手动跳过开场。

## 与现版本的区别

- 此文件只做历史视觉留底；当前开发继续改 `frontend/src/workbench.ts` 和 `workbench.css`。
- 保留旧版任务归属规则：三个演示业务员各一项任务；现版是 Jojo 的同一批三项任务。不要用旧版规则覆盖新版。
- 使用 `cardbot_archive_v2_` 开头的独立存储键，不读取/覆盖当前工作台数据。不包含现有浏览器里输入的内容、真实客户、账号或密钥。
- 只存当前浏览器；复制 HTML 不会复制交互后的草稿。清理浏览器数据可能丢失本地演示记录。
- 旧 CRM 入口只弹出离线限制说明；未打包真实 CRM、后端服务、模型或小满连接；不会发邮件。
- 字体沿用系统字体回退；不同电脑的字体渲染可能略有差异。文件模式验收使用 Chromium，未验证 Safari/Firefox。

## 如何重新生成与验证

仓库安装过依赖后，在项目根目录执行：

```sh
node scripts/archive-preview.mjs
python frontend/tests/cardbot_archive_smoke.py
```

生成脚本从固定历史提交读取五个源文件，使用 esbuild 内嵌依赖，不切换分支，不修改当前前端。需保留该提交的 Git 历史（浅克隆缺失时先补齐历史）。生成时仅将存储键隔离，并将首页/CRM 链接适配为离线行为。测试需要 Python Playwright/Chromium，不需要启动 5190；断网验证零外部请求、语言/主题切换、人工审核/保存/刷新持久化。

该 HTML 是用户明确要求版本化保存的交付文件，不是日常 `dist/` 构建缓存。第三方许可随文件内嵌，同时保留仓库原有 LICENSE 和 THIRD_PARTY_NOTICES。
