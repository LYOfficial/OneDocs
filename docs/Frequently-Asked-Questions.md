# ❓ 常见问题解答

本文收集了 OneDocs 使用过程中的常见问题及解决方案。

---

## 安装与启动

### Q: macOS 提示"无法验证开发者"？

macOS 安全机制会阻止未签名应用启动。解决方法：

1. 右键点击应用 → 选择「打开」
2. 在弹出的对话框中点击「打开」
3. 或在「系统设置 → 隐私与安全性」中点击「仍要打开」

### Q: Windows 安装时提示"SmartScreen 已阻止"?

1. 点击「更多信息」
2. 点击「仍要运行」

### Q: Linux AppImage 无法运行？

```bash
# 添加执行权限
chmod +x OneDocs_*.AppImage

# 运行
./OneDocs_*.AppImage
```

如果仍然无法运行，可能需要安装 FUSE：

```bash
# Ubuntu/Debian
sudo apt install libfuse2

# Fedora
sudo dnf install fuse-libs
```

---

## 模型与 API

### Q: 分析时报错怎么办？

按以下步骤排查：

1. **检查 API Key**：确认 Key 是否正确，注意前后空格
2. **检查网络**：确认能正常访问 API 服务
3. **检查额度**：确认 API 账户有余额
4. **切换模型**：尝试使用其他模型
5. **免费模型**：如果使用免费模型，可能是额度用尽

### Q: 免费模型无法使用？

OneDocs 内置的免费模型额度有限，可能暂时不可用。建议：

- 稍后重试
- 切换其他免费模型
- 使用付费模型（DeepSeek 价格极低，推荐尝试）

### Q: API Key 安全吗？

API Key 仅保存在本地 `localStorage` 中，不会上传到任何服务器。但请注意：

- 不要在公共电脑上保存 API Key
- 定期更换 API Key
- 卸载应用前确认已清除个人数据

---

## 文档分析

### Q: 支持哪些文件格式？

目前仅支持 **PDF** 格式。后续版本会支持更多格式（Word、PPT 等）。

### Q: 文件大小有限制吗？

单个文件不超过 **30 MB**。如果文件过大，建议：

- 压缩 PDF 后再上传
- 将大文件拆分为多个小文件

### Q: 分析结果中公式显示异常？

OneDocs 内置的 Markdown 渲染器支持大部分 LaTeX 公式，但某些复杂公式可能渲染不完整。解决方案：

1. 切换到「源码模式」查看原始公式
2. 复制 Markdown 源码到 Typora 等专业编辑器查看
3. 导出为 `.md` 文件后用其他工具打开

### Q: 分析质量不好？

- 尝试使用更高级的模型（如从 GPT-3.5 升级到 GPT-4o）
- 开启「格式复查」功能（设置 → 通用）
- 配置 RAG 嵌入模型提升分析质量
- 确保文档内容清晰、文字可提取（扫描版 PDF 效果较差）

### Q: 扫描版 PDF 分析效果差？

扫描版 PDF 的文字以图片形式存在，OneDocs 目前主要提取文本层内容。如果 PDF 是纯扫描件（无可提取文字），分析效果会大打折扣。建议：

- 使用 OCR 工具预处理扫描件
- 尽量使用文字版 PDF

---

## 功能使用

### Q: 如何重新触发首次启动引导？

在 DevTools（F12）Console 中执行：

```js
localStorage.removeItem('onedocs-storage')
```

然后按 **Ctrl+R** 刷新页面。

### Q: 如何切换界面语言？

在「设置 → 通用」中选择中文或 English。

### Q: 如何切换深色模式？

- 点击导航栏右侧的主题切换按钮
- 或在「设置 → 外观」中选择浅色/深色/跟随系统

### Q: 分析结果可以编辑吗？

OneDocs 目前不支持直接编辑分析结果。你可以：

1. 复制 Markdown 源码到外部编辑器编辑
2. 导出为 `.md` 文件后编辑

---

## 数据与隐私

### Q: 我的文件安全吗？

OneDocs 是本地应用，所有文档处理均在本地完成：

- 文件不会上传到任何第三方服务器
- API 调用仅发送文档的**文本内容**到模型供应商
- 分析结果保存在本地

### Q: 数据存储在哪里？

- 应用数据保存在本地 `localStorage` 中
- 存档数据保存在本地数据目录中（可在设置中查看）
- 不会上传到任何云端

### Q: 如何清除所有数据？

在 DevTools（F12）Console 中执行：

```js
// 清除所有应用数据
localStorage.clear()
```

然后按 **Ctrl+R** 刷新页面。

---

## 其他

### Q: 如何获取最新版本？

- 在「发现」页面查看版本更新记录
- 前往 [GitHub Releases](https://github.com/LYOfficial/OneDocs/releases/latest) 下载最新版

### Q: 如何反馈问题？

- [GitHub Issues](https://github.com/LYOfficial/OneDocs/issues)：提交 Bug 报告或功能建议
- [GitHub Discussions](https://github.com/LYOfficial/OneDocs/discussions)：参与讨论

### Q: OneDocs 是免费的吗？

OneDocs 是开源免费软件（GPL v3.0 协议），但使用 AI 模型可能需要付费：

- 内置免费模型可直接使用
- 付费模型需要自行购买 API Key
- 本地模型（Ollama/LM Studio）完全免费

### Q: 支持哪些操作系统？

| 系统 | 最低版本 |
|------|---------|
| Windows | Windows 10 及以上 |
| macOS | macOS 10.15 及以上 |
| Linux | 主流发行版均支持 |
