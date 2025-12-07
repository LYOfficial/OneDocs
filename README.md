![OneDocs](https://socialify.git.ci/LYOfficial/OneDocs/image?description=1&font=KoHo&forks=1&issues=1&language=1&logo=https%3A%2F%2Foss.1n.hk%2Flyofficial%2Fimages%2Ficon.png&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto)

<p align="center">
    <a href="./README.md">中文简体</a> | <a href="./README_EN.md">English</a>
</p>

<p align="center">
<img src="https://oss.1n.hk/lyofficial/images/onedocs/milestone1.svg" alt="milestone1" height="54" /> <a href="https://www.producthunt.com/products/onedocs?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-onedocs" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1045456&theme=light&t=1765113607287" alt="OneDocs - A&#0032;single&#0032;text&#0044;&#0032;all&#0032;is&#0032;known&#0046; | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>


# OneDocs

> A Single Text, All is Known.
>
> 一文亦闻，一款文档智慧分析工具。

阁下若对此项目**有所青睐**，还请**移步右上**，点亮那颗**星标**，不胜感谢。

[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white&labelColor=24C8DB)](https://tauri.app/) ![React Badge](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript Badge](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Markdown Badge](https://img.shields.io/badge/Markdown-000000?logo=markdown&logoColor=white&style=for-the-badge) ![LaTeX Badge](https://img.shields.io/badge/LaTeX-008080?logo=latex&logoColor=white&style=for-the-badge)

**文章千卷，一览而知。智慧之器，助君析文明理。**

OneDocs者，一文亦闻也，乃集诸多智能提示之力，助君速览文档精髓，无论新闻要览、数据解析，抑或学科要点，皆可一键明了。

## 项目介绍
当今数据时代，各行各业有各种文档需要我们阅读和分析，有每日新鲜的新闻报告、工作场景的数据表格、学习生活中的课件文档……各种文档中**有精华亦有糟粕**，人力阅读和筛选会**占用大量的时间**，有没有什么工具能**将那些无用内容筛去**，像学霸笔记那样**将精华内容整理分析**方便我们阅读和学习呢？

于是我做了这个AI工具，**OneDocs**，给它起了个好听的中文名「**一文亦闻**」，结合文件分析、大模型应用和输出格式规范化，对用户上传的文件进行解构分析，去除无用内容，整理成知识手册。希望用户能通过大模型的力量，通过一个个简单的文档了解事情的本质，学习和进步。

目前软件支持**Word、PPT、TXT、PDF**这些主流文档格式，支持**40+模型**选择，支持**Windows/macOS/Linux跨平台**使用，基本满足各类用户使用需求。且软件为本地下载使用，无文件上传，不会造成文件和API Key泄露。

软件功能主要有四种：

- **要闻概览**——新闻要点梳理
- **罗森析数**——数据内容分析
- **理工速知**——理工课件整理
- **文采丰呈**——文科课件整理

分析后的结果可以预览、复制Markdown源码和导出下载，亦可以同时分析多文件进行合并下载。

## 软件截图

<img src="http://oss.1n.hk/lyofficial/images/onedocs/onedocs1.png" alt="OneDocs" height="320"/><img src="http://oss.1n.hk/lyofficial/images/onedocs/onedocs2.png" alt="OneDocs" height="320"/>
<img src="http://oss.1n.hk/lyofficial/images/onedocs/onedocs3.png" alt="OneDocs" height="320"/><img src="http://oss.1n.hk/lyofficial/images/onedocs/onedocs4.png" alt="OneDocs" height="320"/>
<img src="http://oss.1n.hk/lyofficial/images/onedocs/onedocs5.png" alt="OneDocs" height="320"/><img src="http://oss.1n.hk/lyofficial/images/onedocs/onedocs6.png" alt="OneDocs" height="320"/>


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
