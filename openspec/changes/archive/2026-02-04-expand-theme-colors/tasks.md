## 1. 新增主题定义文件

- [x] 1.1 创建 `lib/themes/warm.js` - 暖色系主题（橙/红/黄，shadow=true, arcSize=10）
- [x] 1.2 创建 `lib/themes/cool.js` - 冷色系主题（绿/青/紫，shadow=false, arcSize=0）
- [x] 1.3 创建 `lib/themes/dark.js` - 深色模式主题（暗底浅字，shadow=true, arcSize=10）
- [x] 1.4 创建 `lib/themes/contrast.js` - 高对比度主题（纯黑白，shadow=false, arcSize=0）
- [x] 1.5 创建 `lib/themes/pastel.js` - 柔和粉彩主题（马卡龙色，shadow=false, arcSize=10）
- [x] 1.6 创建 `lib/themes/forest.js` - 森林绿系主题（绿色系，shadow=false, arcSize=0）
- [x] 1.7 创建 `lib/themes/violet.js` - 紫罗兰系主题（紫色系，shadow=true, arcSize=10）
- [x] 1.8 创建 `lib/themes/neutral.js` - 中性灰阶主题（多层次灰，shadow=false, arcSize=0）

## 2. 主题导出集成

- [x] 2.1 修改 `lib/themes/index.js` - 导入并导出所有 10 个主题

## 3. 样式预设适配

- [x] 3.1 修改 `lib/style-presets.js` - 扩展 `getPresetDefaults()` 函数支持所有新主题
