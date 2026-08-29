---
name: 鼠鼠桌面小宠
description: 一只柔和、克制又有生命感的 Windows 仓鼠桌面伙伴
colors:
  accent: "#6f678f"
  ground: "#f4f6f8"
  ink: "#242631"
  muted: "#727888"
  violet-surface: "#e9e5f2"
  blue-surface: "#e6eef5"
  cyan-surface: "#e4f0ed"
  yellow-surface: "#f5efda"
typography:
  display:
    fontFamily: "Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "clamp(24px, 2.35vw, 34px)"
    fontWeight: 650
    lineHeight: 1.18
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Microsoft YaHei UI, Microsoft YaHei, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  surface: "16px"
  control: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "#302d3a"
    textColor: "#f7f6f9"
    rounded: "{rounded.control}"
    padding: "10px 16px"
---

# Design System: 鼠鼠桌面小宠

## Overview

**Creative North Star: "柔瓷陪伴物"**

界面像一件长期放在桌边的柔瓷小物：安静、亲近、有触感，但不会用过度装饰抢走鼠鼠本身的注意力。首页把一只连贯的仓鼠作为唯一主视觉，色彩区分功能但不把它拆成一堆独立卡片。

**Key Characteristics:**

- 冷月白空间承托低饱和传统色。
- 仓鼠形态承担导航和品牌记忆。
- 文字短、层级少，交互说明在需要时出现。
- 动效只用于反馈、呼吸感和状态变化。

## Colors

色彩以冷月白为底，雪青作为唯一强调色，天水碧、淡蓝和缃叶只承担低对比功能分区。

**The Quiet Accent Rule.** 强调色只用于焦点、关键文字和主要操作，不铺满大面积背景。

## Typography

显示与正文统一使用适合中文桌面环境的无衬线系统字体。标题靠字重、紧凑字距和留白建立层级，不使用英文眉题或装饰性大写字。

## Layout

主页是单画布结构。顶栏高度约 72px，主视觉位于中央并在 900px 以下整体等比收敛；较矮窗口进一步缩放，所有入口仍保持同一空间关系。功能详情保持现有信息架构并在独立内容区显示。

## Elevation & Depth

默认依靠色阶、内部高光和柔和的有偏移阴影建立深度。大面积黑色外发光、零偏移彩色光晕和每个区域都带厚重卡片阴影都不属于该系统。

**The Resting Surface Rule.** 表面静置时接近平面，只有悬停和焦点状态获得明显抬升。

## Shapes

信息面板采用 16px 柔和圆角，按钮采用全圆胶囊。仓鼠导航例外，它使用连续的有机轮廓和细接缝；部件必须相互靠近，不能呈现隔空漂浮。

## Components

### Buttons

- 主要按钮使用深炭紫底和浅色文字，全圆造型。
- 悬停时变为雪青强调色并轻微上移，按下时回落和缩小。
- 键盘焦点使用半透明雪青轮廓，不能只依赖颜色变化。

### Cards / Containers

- 功能详情容器使用 16px 圆角和月白半透明表面。
- 阴影带背景色倾向并有垂直偏移。
- 首页不使用常规卡片网格，仓鼠本身就是入口结构。

### Navigation

- 品牌与“叫鼠鼠出来”常驻顶栏。
- 仓鼠六个身体区域是主页导航；默认显示动作名称，补充说明只在悬停或键盘聚焦时出现。

### Hamster Feature Map

耳朵、脑袋、小手和肚子形成一只完整仓鼠。每块使用同一材质、同一文字层级和同一反馈节奏，辅助色只表达区域差异。

## Do's and Don'ts

### Do:

- **Do** 让仓鼠始终是第一视觉焦点。
- **Do** 用大面积留白和细微色阶保持高级感。
- **Do** 同时验证大窗口、矮窗口、键盘焦点和减少动态偏好。

### Don't:

- **Don't** 把首页重新变成侧栏加功能卡片列表。
- **Don't** 使用紫蓝霓虹发光、格纹背景或随机玻璃卡片。
- **Don't** 用表情符号代替统一的功能信息层级。
- **Don't** 为了修复问题删除原有功能。

