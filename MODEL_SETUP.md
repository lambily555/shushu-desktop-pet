# 3D 模型安装说明

公开仓库没有包含 BOOTH 等第三方付费或限制再分发的模型。

如需启用 3D 形态，请使用自己制作或明确允许再分发的模型，并自行放入：

```text
assets/models/booth-hamster/restored/Assets/Ham/Mesh/Ham.fbx
assets/models/booth-hamster/restored/Assets/Ham/Texture/Ham.png
```

随后将 `src/dashboard.html` 中禁用的 3D 形态按钮恢复，并把默认 `petForm` 改为 `3d`。提交 Pull Request 时，请同时提供模型来源和许可证证明。

