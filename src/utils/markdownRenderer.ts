import { marked } from "marked";
import katex from "katex";

marked.setOptions({
  breaks: true,
  gfm: true,
});

export class MarkdownRenderer {
  static render(content: string): string {
    if (!content) return "";

    try {
      const mathStore: Map<string, { latex: string; isBlock: boolean }> =
        new Map();
      let counter = 0;

      content = content.replace(/\$\$([^$]+?)\$\$/gs, (_match, latex) => {
        const id = `KATEXBLOCK${counter}KATEX`;
        mathStore.set(id, { latex: latex.trim(), isBlock: true });
        counter++;
        return `\n\n${id}\n\n`;
      });

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

      let html = marked.parse(content) as string;

      console.log("Markdown 渲染完成，开始替换公式");

      mathStore.forEach(({ latex, isBlock }, id) => {
        try {
          const rendered = katex.renderToString(latex, {
            displayMode: isBlock,
            throwOnError: false,
            output: "html",
          });

          html = html.replace(new RegExp(id, "g"), rendered);
          html = html.replace(new RegExp(`<p>${id}</p>`, "g"), rendered);
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

  static downgradeHeadings(markdown: string): string {
    return markdown.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
      return `${hashes}# ${text}`;
    });
  }
}
