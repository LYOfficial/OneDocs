import { marked } from "marked";
import katex from "katex";

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

export class MarkdownRenderer {
  /**
   * 渲染 Markdown 内容（包含 LaTeX 数学公式支持）
   */
  static render(content: string): string {
    if (!content) return "";

    try {
      // 存储数学公式
      const mathStore: Map<string, { latex: string; isBlock: boolean }> =
        new Map();
      let counter = 0;

      // 第一步：提取块级公式 $$...$$
      content = content.replace(/\$\$([^$]+?)\$\$/gs, (_match, latex) => {
        const id = `KATEXBLOCK${counter}KATEX`;
        mathStore.set(id, { latex: latex.trim(), isBlock: true });
        counter++;
        return `\n\n${id}\n\n`;
      });

      // 第二步：提取行内公式 $...$
      content = content.replace(
        /(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g,
        (_match, latex) => {
          const id = `KATEXINLINE${counter}KATEX`;
          mathStore.set(id, { latex: latex.trim(), isBlock: false });
          counter++;
          return id;
        },
      );

      console.log("提取公式数量:", mathStore.size);

      // 第三步：渲染 Markdown
      let html = marked.parse(content) as string;

      console.log("Markdown 渲染完成，开始替换公式");

      // 第四步：替换所有占位符
      mathStore.forEach(({ latex, isBlock }, id) => {
        try {
          const rendered = katex.renderToString(latex, {
            displayMode: isBlock,
            throwOnError: false,
            output: "html",
          });

          // 使用多种模式查找并替换
          // 1. 直接替换
          html = html.replace(new RegExp(id, "g"), rendered);
          // 2. 在 <p> 标签中
          html = html.replace(new RegExp(`<p>${id}</p>`, "g"), rendered);
          // 3. 在 <p> 标签中带空格
          html = html.replace(
            new RegExp(`<p>\\s*${id}\\s*</p>`, "g"),
            rendered,
          );

          console.log(`已替换: ${id}`);
        } catch (error) {
          console.error("KaTeX 错误:", error, "公式:", latex);
          const fallback = isBlock ? `<div>$$${latex}$$</div>` : `$${latex}$`;
          html = html.replace(new RegExp(id, "g"), fallback);
        }
      });

      // 第五步：清理可能残留的占位符
      html = html.replace(/KATEX(BLOCK|INLINE)\d+KATEX/g, (match) => {
        console.warn("发现未替换的占位符:", match);
        return "[公式]";
      });

      return html;
    } catch (error) {
      console.error("Markdown 渲染错误:", error);
      return `<p>内容渲染失败</p><pre>${content}</pre>`;
    }
  }

  /**
   * 提取纯文本（移除 HTML 和公式）
   */
  static extractPlainText(markdown: string): string {
    let text = markdown
      .replace(/\$\$.*?\$\$/g, "[公式]")
      .replace(/\$.*?\$/g, "[公式]");

    text = text
      .replace(/^#+\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/```[\s\S]*?```/g, "[代码块]");

    return text.trim();
  }

  /**
   * 将Markdown中的标题降级（一级降为二级，二级降为三级，以此类推）
   * @param markdown 原始Markdown内容
   * @returns 降级后的Markdown内容
   */
  static downgradeHeadings(markdown: string): string {
    return markdown.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
      // 在每个#前再加一个#，实现降级
      return `${hashes}# ${text}`;
    });
  }
}
