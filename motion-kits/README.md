# CardBot 动效分享

**直接转发给朋友：[在线浏览与下载](https://opc8838-hub.github.io/cardbot/motion-kits/)。**

## 登录转场的两块交付

| 内容 | 浏览 | 下载与说明 |
| --- | --- | --- |
| 原版完整开场与参数 | [播放完整开场](https://opc8838-hub.github.io/cardbot/?intro=1) | [原版动效数据](../frontend/motion/cardbot-entry/)、[原版 CSS](../frontend/src/cardbot-preview.css)、[控制代码](../frontend/src/cardbot-preview.ts) |
| 独立卡牌登录转场 | [播放独立转场](https://opc8838-hub.github.io/cardbot/motion-kits/login-handoff/) | [下载 ZIP](https://opc8838-hub.github.io/cardbot/motion-kits/cardbot-login-handoff.zip)、[接入说明](login-handoff/README.md)、[参数 JSON](login-handoff/motion-spec.json) |

独立包是 60fps、108 帧、1.8 秒的卡片接管和登录翻转。包含 HTML/CSS/JS、TypeScript 视频接入示例、JSON 参数、关键帧参考图与许可。ZIP 解压后直接打开 `index.html`。更换前置视频时，按照视频末帧重新匹配尺寸与位置。

[下载原版 CardBot 全部源码 ZIP](https://github.com/opc8838-hub/cardbot/archive/refs/heads/main.zip)。这个完整仓库包含原卡牌视频和音乐，运行需按照主 README 安装依赖；只移植登录转场时使用上面的轻量独立包。

## 已有的 Bot 与卡牌编辑器

- [Bot 形象与表情编辑器](https://opc8838-hub.github.io/bot/)
- [多卡牌编排动效编辑器](https://opc8838-hub.github.io/bot/motion.html)
- [Bot 仓库与使用说明](https://github.com/opc8838-hub/bot)
- [下载 Bot 编辑器源码 ZIP](https://github.com/opc8838-hub/bot/archive/refs/heads/main.zip)

登录转场通过代码与参数调整；Bot 和卡牌编排具有各自的可视化编辑器。两个仓库分别保留自己的许可和作者说明。

## 维护下载包

修改 `login-handoff/` 后运行 `python scripts/package-login-handoff.py`，重新生成 `cardbot-login-handoff.zip`。Pages 发布整个目录，因此源码、在线预览和下载包一起更新。
