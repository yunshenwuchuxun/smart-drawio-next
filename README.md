# Smart Drawio Next

[English](./README.en.md)

> 用自然语言或参考图片，在几秒内生成可编辑、适合科研与演示场景的 Draw.io 图表。

## 在线体验

- 在线地址：<https://smart-drawio-next.vercel.app/>
- 说明：在线版本需要你自行提供 API Key

## 效果预览

| 首页 | Transformer |
|------|-------------|
| ![首页](./public/images/page.png) | ![Transformer](./public/images/transformer.png) |

| Swin-Transformer | CLIP |
|------------------|------|
| ![Swin-Transformer](./public/images/swin.png) | ![CLIP](./public/images/clip.png) |

| ProSST |
|--------|
| ![ProSST](./public/images/prosst.png) |

## 项目简介

[smart-drawio-next](https://github.com/yunshenwuchuxun/smart-drawio-next) 是一个基于 Next.js 16、Draw.io embed 和流式 LLM 调用的图表生成工具，适合：

- 用自然语言快速生成流程图、架构图、时序图等结构化图表
- 上传参考图片，让 Vision 模型提取结构并转成可编辑内容
- 在 Monaco Editor 中直接修改 XML / JSON
- 将结果同步到内嵌 Draw.io 画布中继续可视化微调
- 使用高级优化面板统一布局、线条、样式和注释

项目内置多模型配置、访问密码、历史记录和通知系统，可直接部署为个人工具或团队内部服务。

## 核心能力

- **流式生成**：实时显示生成过程，长内容可继续生成
- **多模态输入**：支持文本描述和参考图片
- **代码与画布双视图**：XML 编辑与 Draw.io 渲染同步联动
- **后处理工具链**：可批量优化结构、连线、文字和视觉风格
- **多配置管理**：支持 OpenAI / Anthropic 兼容接口
- **本地历史记录**：最近 20 条生成结果可回放

## 支持的图表类型

支持 20+ 种图表类型，可手动指定，也可让模型自动判断：

- 流程图
- 思维导图
- 组织架构图
- 时序图
- UML 类图
- ER 图
- 甘特图
- 时间线
- 树形图
- 网络拓扑图
- 架构图
- 数据流图
- 状态图
- 泳道图
- 概念图
- 鱼骨图
- SWOT 分析图
- 金字塔图
- 漏斗图
- 维恩图
- 矩阵图
- 信息图

## 内置主题

内置 10 套主题配色：

- 科研（Research）
- 商务（Business）
- 暖色（Warm）
- 冷色（Cool）
- 暗色（Dark）
- 高对比（Contrast）
- 马卡龙（Pastel）
- 森林（Forest）
- 紫罗兰（Violet）
- 中性（Neutral）

## 工具系统

生成后可以在侧边栏的“工具”面板中继续处理图表。所有操作基于 XML 变换，即时生效，并可继续迭代。

### 1. 绘图技巧

用于批量优化结构与连线：

- **网格对齐**：坐标吸附到 10px 网格
- **正交路由**：连线转为直角折线
- **曲线连线**：连线转为平滑曲线
- **标签背景**：给连线标签添加白底
- **统一间距**：调整同层元素的水平间距
- **交叉跳跃**：交叉连线显示跳跃弧线
- **圆角连线**：让拐角更柔和
- **统一箭头**：统一终点箭头样式
- **清除拐点**：删除手动 waypoint，交给自动路由

### 2. 样式预设

用于叠加局部视觉效果：

- 阴影效果
- 渐变填充
- 圆角样式
- 玻璃效果
- 手绘风格
- 漫画风格
- 虚线描边
- 透明填充
- 粗线描边
- 无边框
- 等宽圆角
- 交叉填充
- 点状填充
- 锯齿填充
- 半透明
- 描边渐隐
- 固定虚线
- 空心箭头

### 3. 风格套装

用于一键应用完整视觉风格：

- **科研清爽**：规整、克制，适合论文插图
- **演示卡片**：圆角、阴影、曲线，适合汇报展示
- **商务简约**：正式商务风格
- **扁平极简**：去装饰的现代扁平风
- **线框草图**：适合讨论布局和信息层级
- **漫画白板**：轻松、非正式讨论风格
- **水彩手绘**：更具草图感和艺术感
- **极简线条**：只保留轮廓和文本
- **便签卡片**：便签式卡片视觉
- **蓝图技术**：适合工程图、技术图纸

### 4. 文本工具

用于统一文字排版：

- 自动换行
- 文本居中
- 文本衬底
- 文本加粗
- 缩小字号
- 文本间距

## 界面结构

1. **输入区（Chat + ImageUpload）**
   - 输入自然语言描述
   - 上传参考图片
   - 支持停止生成、继续生成、错误提示

2. **代码区（CodeEditor）**
   - 查看和编辑 XML / JSON
   - 执行清空、优化、高级优化、应用等操作

3. **画布区（DrawioCanvas）**
   - 渲染生成结果
   - 在 Draw.io 中继续可视化调整

4. **辅助弹窗**
   - `ConfigManager`
   - `AccessPasswordModal`
   - `HistoryModal`
   - `OptimizationPanel`
   - 其他辅助面板

## 技术栈

- **框架**：Next.js 16 (App Router) + React 19
- **画布**：Draw.io embed
- **编辑器**：`@monaco-editor/react`
- **样式**：Tailwind CSS v4
- **LLM 接入**：OpenAI / Anthropic 兼容接口 + SSE 流式响应
- **状态持久化**：localStorage

## 快速开始

### 环境要求

- Node.js >= 18.18
- pnpm >= 8
- 可用的 OpenAI / Anthropic 兼容 API Key

### 安装与启动

```bash
git clone https://github.com/yunshenwuchuxun/smart-drawio-next.git
cd smart-drawio-next
pnpm install
pnpm dev
```

启动后访问：<http://localhost:3000>

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发环境 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm lint` | 运行 ESLint |
| `pnpm test -- run` | 运行单元测试 |

## Docker 部署

### 前提条件

- Docker >= 20.10
- Docker Compose V2

### 快速启动

```bash
docker compose up -d --build
```

启动后访问：<http://localhost:3000>

镜像使用多阶段构建和 Next.js standalone 输出，适合直接部署。

### 服务端 LLM 配置（可选）

如果希望多个用户共享同一套服务端配置，可在 `docker-compose.yml` 中配置：

```yaml
services:
  app:
    environment:
      - ACCESS_PASSWORD=your-secure-password
      - SERVER_LLM_TYPE=openai
      - SERVER_LLM_BASE_URL=https://api.openai.com/v1
      - SERVER_LLM_API_KEY=sk-xxx
      - SERVER_LLM_MODEL=gpt-4
```

也可以使用 `.env` 文件，参考 `.env.example`。

### 代理与本地模型

如果 Docker 需要代理或访问宿主机上的本地模型：

```bash
cp docker-compose.override.example.yml docker-compose.override.yml
```

然后按机器环境修改，再重新启动：

```bash
docker compose up -d --build
```

常见场景：

- 使用宿主机代理访问外网 API
- 访问宿主机上的 Ollama / LM Studio
- 挂载自定义 CA 证书以通过企业代理

### 常用 Docker 命令

```bash
docker compose logs -f app
docker compose down
docker compose up -d --build
docker compose ps
```

## LLM 配置

### 前端多配置模式

默认情况下，用户可以在前端自己配置：

- 提供商（OpenAI / Anthropic / 兼容接口）
- Base URL
- API Key
- Model

所有配置仅保存在浏览器 localStorage 中。

### 服务端访问密码模式

如果你想将 API Key 保留在服务器端：

1. 复制配置文件：

```bash
cp .env.example .env
```

2. 设置以下变量：

- `ACCESS_PASSWORD`
- `SERVER_LLM_TYPE`
- `SERVER_LLM_BASE_URL`
- `SERVER_LLM_API_KEY`
- `SERVER_LLM_MODEL`

3. 重启服务后，用户可通过“访问密码”启用服务端配置。

## 常见问题

### API Key 会上传到第三方吗？

不会。前端本地配置仅保存在浏览器中，请求会先发送到你自己的服务端，再由服务端请求外部模型接口。

### 生成内容被截断怎么办？

界面会自动提供“继续生成”按钮，继续请求剩余内容。

### 图片识别失败怎么办？

请使用支持 Vision 的模型，并确保图片格式与大小符合要求。

### 历史记录会不会越来越大？

不会。默认最多保留最近 20 条。

## 致谢与贡献

- 本项目基于 [smart-excalidraw-next](https://github.com/liujuntao123/smart-excalidraw-next) 演进而来
- 如果项目对你有帮助，欢迎：
  - 给仓库点一个 Star
  - 分享给更多需要的人

## License

MIT
