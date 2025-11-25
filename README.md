![OneDocs](https://socialify.git.ci/LYOfficial/OneDocs/image?description=1&font=KoHo&forks=1&issues=1&language=1&logo=https%3A%2F%2Foss.1n.hk%2Flyofficial%2Fimages%2Ficon.png&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto)

# OneDocs

> A Single Text, All is Known.
>
> 一文亦闻，一款文档智慧分析工具。

阁下若对此项目**有所青睐**，还请**移步右上**，点亮那颗**星标**，不胜感谢。

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white&labelColor=24C8DB)](https://tauri.app/) ![React Badge](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript Badge](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Markdown Badge](https://img.shields.io/badge/Markdown-000000?logo=markdown&logoColor=white&style=for-the-badge) ![LaTeX Badge](https://img.shields.io/badge/LaTeX-008080?logo=latex&logoColor=white&style=for-the-badge)

**文章千卷，一览而知。智慧之器，助君析文明理。**

OneDocs者，一文亦闻也，乃集诸多智能提示之力，助君速览文档精髓，无论新闻要览、数据解析，抑或学科要点，皆可一键明了。
## 测试截图

![介绍页](https://oss.1n.hk/image/up/02d537a812ec13ab1afe9c7934a81e5a.png)

![应用页](https://oss.1n.hk/image/up/8fa2905efe5922ce320d6744d734ec8d.png)

![源码页](https://oss.1n.hk/image/up/3c639cb78d434110f31b450f57de117d.png)


## 使用方法

**1 下载发行版软件**

在项目发行页面找到最新版本： https://github.com/LYOfficial/OneDocs/releases/latest

找到适合于自己系统的软件并下载即可。


**2 启动**

启动软件后，点击“始于一文”，进入功能页面。

**3 填写API KEY**

点击右上角齿轮“设置配置”功能，填入 API Base URL 和 OpenAI API Key，默认 API Base URL 为 OpenAPI 官方地址，若有第三方 API 服务地址请替换。

填写完毕后，选择合适的模型进行后续的分析操作。

> 目前仅支持部分模型调用，后期会进一步完善，提供更多模型接口。

**4 上传分析**

点击“点击选择文档”框上传文档，并根据自己的分析需求在左侧选择合适的功能。

上传和功能选择完毕后，点击“开始析文”按钮，进行分析。

**5 后期处理**

软件内自带有 Markdown 及 LaTeX 格式的渲染，若出现渲染错误，可将 Markdown 格式文本完整复制到外部进行查看，也可点击“导出”按钮进行 PDF 文件导出。

更多详细说明请阅读 Wiki ：[OneDocs Wiki](https://github.com/LYOfficial/OneDocs/wiki)

## 开发

要参与开发和部署这个项目，请先克隆本仓库：

```bash
  git clone https://github.com/LYOfficial/OneDocs.git
```

安装Rust： https://rust-lang.org/zh-CN/tools/install/
```bash
# MacOS 用户选择
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```


启动开发服务器：

```bash
  npm install
  npm run tauri dev
```

构建：

```bash
  npm run tauri build
```


## 作者

- [@LYOfficial ](https://github.com/LYOfficial/) 主要开发，项目主管。
- [@JHL-HK](https://github.com/JHL-HK)  部分重构，图床提供。
