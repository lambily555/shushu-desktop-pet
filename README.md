# 鼠鼠桌面小宠

一只会在 Windows 桌面陪伴你的小仓鼠。它能回应点击和键盘输入、展示真实动态动作、跑跑轮、接受投喂、换装、说话，并记录每日互动日记。

## 主页展示 / Home Preview

![鼠鼠桌面小宠主页 / Hamster Desktop Pet Home](assets/screenshots/home.png)

## 功能

- 透明桌面小宠窗口与系统托盘
- 点击、键盘输入和闲置状态反馈
- 真实动态动作库与自定义动作导入
- 可旋转的 CC0 3D 仓鼠模型，并可与真实动态形态切换
- 菜叶、面包虫、小饼干、营养糊糊投喂互动
- 跑轮、装扮、自定义对话和开心叫声
- 每日互动统计和小鼠日记
- 大小调节、位置拖动与开机后的快捷启动

## 快速开始

需要 Windows 10/11、Node.js 20 或更高版本，以及 pnpm。

```bash
pnpm install
pnpm start
```

生成 Windows 安装包：

```bash
pnpm dist
```

## 自定义鼠鼠

在“鼠鼠动作库”中可以导入透明背景的 WebP、GIF、APNG 或 PNG。为了获得自然效果，建议使用已经抠好主体、动作长度为 3 至 8 秒的素材。

仓库包含由如月十二制作、以 CC0 发布的“ハムちゃん/Hamster”3D模型。来源与许可说明见 [MODEL_SETUP.md](MODEL_SETUP.md)。

## 开源与素材

程序代码使用 MIT License。仓库内的鼠鼠影像、声音和食物素材不属于 MIT 软件许可证；随仓库提供的仓鼠3D模型使用 CC0，具体见 [ASSETS_LICENSE.md](ASSETS_LICENSE.md)。

## 参与贡献

欢迎提交 Issue、功能建议和 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。
