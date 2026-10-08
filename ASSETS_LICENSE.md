# 素材许可说明

本仓库采用“代码与素材分开授权”的方式。

## 程序代码

`src/`、`scripts/` 及项目配置文件按照根目录 `LICENSE` 中的 MIT License 发布。

## 鼠鼠影像与声音

`assets/videos/matted/`、鼠鼠头像、图标及 `assets/audio/hamster-happy.mp3` 来源于项目作者拥有的真实仓鼠素材。版权归原作者所有，仅允许随本项目用于演示、学习和非商业运行。未经原作者书面许可，不得单独提取、重新销售、训练模型或用于其他商业项目。

2026-09-11 更新的六个真实动态文件（`groom-a.webp`、`eat-a.webp`、`eat-b.webp`、`idle-a.webp`、`idle-b.webp`、`groom-b.webp`）已由项目作者确认拥有素材或取得授权，并允许公开处理后的透明动画，适用上述素材使用条款。原始视频不包含在公开仓库中。

## 食物图片

`assets/foods/` 为项目交互使用的处理后图片。仅允许随本项目用于演示、学习和非商业运行，不授予单独再分发或商业使用权。

## AI 漫剧鼠鼠动画

`assets/ai-drama-pet/` 中的透明动画由项目作者拥有的真实仓鼠照片和视频作为形象与动作参考，通过生成式图像、视频处理和透明背景处理制作。版权归项目作者所有，仅允许随本项目用于演示、学习和非商业运行。未经项目作者书面许可，不得单独提取、重新销售、用于训练模型或用于其他商业项目。

公开仓库仅包含应用运行所需的最终 WebP 动画和动作清单，不包含作者的原始照片、动作母版、逐帧工程文件、测试截图或生成缓存。

## CC0 仓鼠3D模型

`assets/models/booth-hamster/restored/Assets/Ham/` 中的 `Ham.fbx`、`Ham.png` 和 `Ham_mask.png` 来自如月十二制作的“ハムちゃん/Hamster”。作者在 BOOTH 商品页面明确将3D模型数据以 CC0 发布，因此模型允许复制、修改、商用和再分发。

- 作者：如月十二
- 原始名称：オリジナル3Dモデル「ハムちゃん/Hamster」
- 来源：https://booth.pm/en/items/2621226
- 许可：CC0 1.0 Universal

仓库没有包含 VRCSDK、UTS2.0、WFUnlit Shader 或完整 Unity 工程；这些第三方组件拥有各自的许可。

## 程序化鼠鼠小屋

`src/town-cottage.js` 由本项目代码生成建筑几何、细毛绒、苔藓、蘑菇以及木纹画布材质，按仓库代码许可发布。参考图片仅用于外观方向，不作为纹理或其他运行资源分发；预览 GLB 和测试截图不包含在公开仓库中。
菜园与中心广场由 src/town-grounds.js 的程序几何和 Canvas 纹理生成，遵循仓库代码许可；参考照片不包含在发布内容中。
零食铺、医院、殡仪馆与纪念馆同样由 src/town-grounds.js 的程序几何和 Canvas 招牌生成，遵循仓库代码许可；用户提供的参考图及预览截图不作为运行资源分发。
墓园由 src/town-grounds.js 程序几何与 Canvas 铭牌生成，遵循仓库代码许可；参考图不作为运行素材发布。

鼠鼠饭馆的建筑、瓦片、餐桌和厨房均由项目代码生成，参考照片不随项目分发。


## Mariah Carey 名人堂
建筑、唱片、展柜及占位画面由代码生成。用户提供的专辑与照片仅在本地使用，未随本仓库分发；无私人贴图时自动显示程序生成的专辑名称封面及照片占位卡。

## 宠物之家与 Cube Pets

宠物之家建筑、货架、柜台、花盆、宠物窝与玩具由 `src/town-pet-home.js` 程序生成。用户参考图片仅用于建模方向，不作为运行素材或贴图公开。

`assets/models/cube-pets/animal-cat.glb`、`animal-dog.glb`、`Textures/colormap.png` 来自 Kenney Cube Pets 2.0，按 CC0 使用及再分发，原始许可保存在同目录 `License.txt`。
来源：https://kenney.nl/assets/cube-pets
许可：https://creativecommons.org/publicdomain/zero/1.0/
仅发布运行所需的猫、狗及共用颜色贴图，完整下载包和预览截图不包含在公开仓库。
