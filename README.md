# 鼠鼠桌面小宠

一只会在 Windows 桌面陪伴你的小仓鼠。它能回应点击和键盘输入，在 3D、真实动态与仿真形态之间切换，还能跑跑轮、接受投喂、换装、说话，并在可交互的 3D 鼠鼠小镇里经营自己的生活。

A Windows desktop hamster companion with interactive 3D, real-motion, and lifelike forms, feeding, outfits, dialogue, a running wheel, daily journals, and an autonomous 3D hamster town.

## 主页展示 / Home Preview

![鼠鼠桌面小宠主页 / Hamster Desktop Pet Home](assets/screenshots/home.png)

## 功能

- 透明桌面小宠窗口与系统托盘
- 点击、键盘输入和闲置状态反馈
- 真实动态动作库与自定义动作导入
- 可在可旋转的 CC0 3D 模型、真实动态和仿真形态之间切换
- 仿真形态包含待机呼吸、打字、睡眠、侧躺、开心、爬行、进食和跑轮等透明动画
- 菜叶、面包虫、小饼干、营养糊糊投喂互动
- 跑轮、装扮、自定义对话和开心叫声
- 每日互动统计和小鼠日记
- 可旋转、缩放和点击地点的 3D 鼠鼠小镇，包含现实昼夜、离线生活结算和独立生命设置
- 大小调节、位置拖动与开机后的快捷启动

## Lifelike Form / 仿真形态

The lifelike form includes transparent animations for idle breathing, typing, sleeping, lying down, happiness, crawling, feeding, and running on the wheel. Only final runtime WebP files and the manifest are published; source videos, frame projects, generation sheets, and test captures remain private.

仿真形态包含待机呼吸、打字、睡眠、侧躺、开心、爬行、进食和跑轮等透明动画。公开仓库只提供运行所需的最终 WebP 与动作清单，原始视频、逐帧工程、生成母版和测试截图不会公开。

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

## AI 聊天 API 兼容性

AI 聊天只支持采用 OpenAI **Chat Completions** 请求格式的接口。程序会向配置地址发送 `POST /chat/completions`，使用 `Authorization: Bearer <API Key>` 鉴权，并读取 `choices[0].message.content`。可以填写服务商提供的 API 根地址，也可以填写以 `/chat/completions` 结尾的完整接口地址。

| 服务 | API 地址示例 | 模型示例 | 状态 |
| --- | --- | --- | --- |
| Groq | `https://api.groq.com/openai/v1` | `openai/gpt-oss-20b` | 已实测 |
| 本地模拟接口 | `http://127.0.0.1:<端口>/v1` | 由本地服务决定 | 已用于自动测试 |
| OpenAI | `https://api.openai.com/v1` | 以服务商当前模型列表为准 | 按官方兼容协议支持，未在本项目中使用付费 Key 实测 |
| Gemini OpenAI 兼容层 | `https://generativelanguage.googleapis.com/v1beta/openai` | 以 Google 当前模型列表为准 | 按官方兼容协议支持，未实测 |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` | 按官方兼容协议支持，未实测 |
| Ollama 本地服务 | `http://localhost:11434/v1` | 已在 Ollama 下载的模型名 | 按官方兼容协议支持，未实测 |

不支持直接填写 Anthropic Messages API、Gemini 原生 API、OpenAI Responses API 或其他非 Chat Completions 格式。第三方服务可能调整模型名、免费额度、地区限制或兼容行为，请以服务商当前文档为准。遇到 `401`/`403` 时检查 Key、账户权限和地区网络；遇到 `404` 时检查地址和模型名；遇到 `429` 时表示已达到服务商速率或额度限制。

相关官方文档：[OpenAI Chat Completions](https://platform.openai.com/docs/api-reference/chat)、[Groq OpenAI Compatibility](https://console.groq.com/docs/openai)、[Gemini OpenAI Compatibility](https://ai.google.dev/gemini-api/docs/openai)、[DeepSeek API](https://api-docs.deepseek.com/zh-cn/)、[Ollama OpenAI Compatibility](https://docs.ollama.com/api/openai-compatibility)。

API Key 保存在当前电脑的应用设置中，不会由本项目主动上传到其他位置。请勿在公共电脑保存 Key，也不要把配置文件、Key 或含 Key 的截图提交到 GitHub。

## 自定义鼠鼠

在“鼠鼠动作库”中可以导入透明背景的 WebP、GIF、APNG 或 PNG。为了获得自然效果，建议使用已经抠好主体、动作长度为 3 至 8 秒的素材。

仓库包含由如月十二制作、以 CC0 发布的“ハムちゃん/Hamster”3D模型。来源与许可说明见 [MODEL_SETUP.md](MODEL_SETUP.md)。

## 开源与素材

程序代码使用 MIT License。仓库内的鼠鼠影像、声音和食物素材不属于 MIT 软件许可证；随仓库提供的仓鼠3D模型使用 CC0，具体见 [ASSETS_LICENSE.md](ASSETS_LICENSE.md)。

## 参与贡献

欢迎提交 Issue、功能建议和 Pull Request。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。
