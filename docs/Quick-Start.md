# 🚀 快速开始

本指南将带你从零开始，完成 OneDocs 的安装、配置和首次文档分析。

---

## 1. 下载与安装

前往 [OneDocs 发行页面](https://github.com/LYOfficial/OneDocs/releases/latest) 下载适合你操作系统的安装包：

| 系统 | 文件格式 | 说明 |
|------|---------|------|
| **Windows** | `.exe` | 推荐 NSIS 安装包，双击运行即可安装 |
| **macOS** | `.dmg` | 打开后拖入应用程序文件夹 |
| **Linux** | `.AppImage` / `.deb` | AppImage 无需安装，直接运行 |

> ⚠️ macOS 用户首次打开可能提示"无法验证开发者"，请在「系统设置 → 隐私与安全性」中点击「仍要打开」。

---

## 2. 启动软件

安装完成后启动 OneDocs，你将看到欢迎页面：

<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p1.png?raw=true" alt="欢迎页面" width="500" />

点击「**始于一文**」进入主界面。

> 💡 首次启动会显示引导教程，帮助你快速了解各功能区域。如需重新查看，可在 DevTools 中执行 `localStorage.removeItem('onedocs-storage')` 后刷新。

---

## 3. 配置模型

OneDocs 需要配置 AI 模型才能使用分析功能。点击顶部导航栏的「**设置**」：

### 方式一：使用免费模型（推荐新手）

1. 进入「**设置**」→「**模型**」
2. 选择 **OneDocs** 供应商（标记为「免费模型」）
3. 无需填写 API Key，直接选择模型即可

> ⚠️ 免费模型因额度有限，有概率无法使用。若遇到错误，请切换其他模型。

### 方式二：使用付费模型

1. 进入「**设置**」→「**模型**」
2. 选择你拥有的供应商（如 OpenAI、智谱 GLM、DeepSeek 等）
3. 填入 **API Key**（必填）
4. 如有自定义 API 地址，填入 **Base URL**（可选）
5. 选择要使用的模型
6. 点击「**保存**」

👉 详细的 API Key 获取教程请阅读 [API Key 获取](Api-Key)

---

## 4. 上传文档

1. 在顶部导航栏点击「**分析**」
2. 在左侧选择分析功能（如「理工速知」）
3. 点击「**点击选择文档**」区域，或直接将 PDF 文件拖拽到上传区域
4. 支持**多文件同时上传**，按住 Ctrl/Cmd 可多选

<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p2.png?raw=true" alt="上传文档" width="500" />

### 文件要求

- 格式：仅支持 **PDF**
- 大小：单个文件不超过 **30 MB**

---

## 5. 开始分析

1. 确认已选择功能和上传文件
2. 点击「**开始析文**」按钮
3. 等待分析完成，进度条会显示当前进度

> 💡 分析时间取决于文档长度和模型响应速度，通常需要几十秒到几分钟。

---

## 6. 查看结果

分析完成后，结果会自动展示在右侧面板中：

- **渲染模式**：查看格式化后的 Markdown 渲染效果（支持 LaTeX 公式）
- **源码模式**：查看原始 Markdown 文本
- **复制**：将 Markdown 源码复制到剪贴板
- **导出**：将结果保存为 `.md` 文件

<img src="https://github.com/LYOfficial/OneDocs/blob/main/public/img/p3.png?raw=true" alt="分析结果" width="500" />

---

## 🎉 完成！

你已经完成了首次文档分析！接下来可以：

- 📖 了解 [四大分析模式](Analysis-Features) 的详细区别
- 🧠 配置 [RAG 嵌入模型](RAG-Embedding) 提升分析质量
- 📦 学习 [多文件合并](Multi-File) 功能
- 🎨 个性化 [外观设置](Appearance)
