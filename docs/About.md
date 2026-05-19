# 📖 关于 OneDocs

## 项目简介

OneDocs（一文亦闻）是一款开源的 AI 智能文档分析工具，旨在帮助用户快速从 PDF 文档中提取关键信息、梳理知识脉络。

无论是新闻要览、数据解析，还是学科要点整理，OneDocs 都能一键生成结构化的分析结果。

---

## 核心理念

> **文章千卷，一览而知。**

当今数据时代，各行各业有各种文档需要阅读和分析——每日新鲜的新闻报告、工作场景的数据表格、学习生活中的课件文档……各种文档中有精华亦有糟粕，人力阅读和筛选会占用大量时间。

OneDocs 的目标就是**将无用内容筛去，像学霸笔记那样将精华内容整理分析**，帮助用户通过大模型的力量，通过一个个简单的文档了解事情的本质。

---

## 技术架构

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 桌面端 | Tauri v2（Rust） |
| 构建工具 | Vite 7 |
| 状态管理 | Zustand 5 |
| PDF 解析 | pdfjs-dist v5（前端文本提取）+ lopdf（Rust 端图片提取） |
| 渲染 | marked（Markdown）+ KaTeX（LaTeX） |
| 国际化 | i18next + react-i18next |

---

## 隐私与安全

- 🔒 **本地处理**：所有文档处理均在本地完成，文件不会上传至任何第三方服务器
- 🔑 **密钥本地存储**：API Key 仅保存在本地，不会外传
- 🌐 **最小化数据传输**：API 调用仅发送文档文本内容到模型供应商

---

## 开源协议

OneDocs 基于 [GNU 通用公共许可证 v3.0](https://github.com/LYOfficial/OneDocs/blob/main/LICENSE) 发布。

---

## 贡献者

- [@LYOfficial](https://github.com/LYOfficial/) — 主要开发，项目主管
- [@JHL-HK](https://github.com/JHL-HK) — 部分重构，图床提供

---

## 鸣谢

衷心感谢以下开源项目：

- [Tauri](https://github.com/tauri-apps/tauri) — 跨平台桌面应用框架
- [lopdf](https://github.com/J-F-Liu/lopdf) — Rust PDF 处理库
- [pdfjs-dist](https://github.com/nicbarker/pdfjs-dist) — PDF 文本解析
- [React](https://github.com/facebook/react) — 用户界面构建库
- [marked](https://github.com/markedjs/marked) — Markdown 解析器
- [KaTeX](https://github.com/KaTeX/KaTeX) — LaTeX 数学公式渲染
- [Zustand](https://github.com/pmndrs/zustand) — 轻量状态管理
- [i18next](https://github.com/i18next/i18next) — 国际化框架

---

## 联系方式

- 📧 邮箱：coldregion@qq.com
- 🐛 [提交问题](https://github.com/LYOfficial/OneDocs/issues)
- 💬 [参与讨论](https://github.com/LYOfficial/OneDocs/discussions)
- 📖 [使用文档](https://github.com/LYOfficial/OneDocs/wiki)

