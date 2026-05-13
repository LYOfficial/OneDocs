import { marked } from "marked";
import katex from "katex";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useAppStore } from "@/store/useAppStore";

const pushDevLog = (
  level: "info" | "warn" | "error",
  scope: string,
  message: string,
  payload?: unknown,
) => {
  const { addLog } = useAppStore.getState();
  if (addLog) {
    addLog({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      level,
      scope,
      message,
      payload,
    });
  }
};

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

      const storeMath = (latex: string, isBlock: boolean) => {
        const id = `${isBlock ? "KATEXBLOCK" : "KATEXINLINE"}${counter}KATEX`;
        mathStore.set(id, { latex: latex.trim(), isBlock });
        counter++;
        return isBlock ? `\n\n${id}\n\n` : id;
      };

      content = content.replace(/\$\$([^$]+?)\$\$/gs, (_match, latex) => {
        return storeMath(latex, true);
      });

      content = content.replace(
        /(?<!\\)(?<!\$)\$(?!\$)([\s\S]+?)(?<!\\)\$(?!\$)/g,
        (_match, latex) => {
          const normalized = latex.trim();
          const isBlock =
            /\\begin|\\end|\\\\|\n|\\cases|\\array|\\align/i.test(
              normalized,
            );
          return storeMath(normalized, isBlock);
        },
      );

      // Extract local image paths before marked.parse to prevent URL encoding issues.
      // marked may mangle Windows paths (C:/...) or other local paths containing colons.
      const imageStore: Map<string, string> = new Map();
      let imageCounter = 0;
      content = content.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        (_match, alt, url) => {
          const decodedUrl = url.trim();
          if (this.isLocalImageSource(decodedUrl)) {
            const placeholder = `LOCALIMG${imageCounter}LOCALIMG`;
            imageStore.set(placeholder, decodedUrl);
            imageCounter++;
            return `![${alt}](${placeholder})`;
          }
          return _match;
        },
      );

      console.log("提取公式数量:", mathStore.size);
      if (imageStore.size > 0) {
        console.log(`提取本地图片路径: ${imageStore.size} 张`);
      }

      let html = marked.parse(content) as string;

      // Restore local image paths and convert to Tauri asset URLs
      imageStore.forEach((originalPath, placeholder) => {
        const normalized = originalPath.replace(/\\/g, "/");
        const converted = convertFileSrc(normalized);
        // marked may have HTML-encoded the placeholder, so try both raw and encoded forms
        html = html.replace(new RegExp(placeholder, "g"), converted);
        // Also handle cases where marked encodes the placeholder in the src attribute
        const encodedPlaceholder = placeholder
          .replace(/LOCALIMG/g, "LOCALIMG");
        html = html.replace(new RegExp(encodedPlaceholder, "g"), converted);
      });

      if (imageStore.size > 0) {
        pushDevLog("info", "markdown-render", `预提取并转换了 ${imageStore.size} 张本地图片路径`, {
          count: imageStore.size,
          paths: Array.from(imageStore.values()),
        });
      }

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

      html = this.rewriteLocalImageSources(html);

      // Add lazy loading to all images to prevent UI freeze when many images load at once
      html = html.replace(
        /<img([^>]*?)>/g,
        (match, attrs) => {
          if (/loading\s*=/.test(attrs)) return match; // already has loading attr
          return `<img${attrs} loading="lazy">`;
        },
      );

      // Add target="_blank" to external links so they open in default browser
      html = this.addTargetBlankToLinks(html);

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

  private static decodeHtmlEntities(str: string): string {
    return str
      .replace(/&#58;/g, ":")
      .replace(/&#47;/g, "/")
      .replace(/&#92;/g, "/")
      .replace(/&#x3A;/gi, ":")
      .replace(/&#x2F;/gi, "/")
      .replace(/&#x5C;/gi, "/")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  }

  private static rewriteLocalImageSources(html: string): string {
    let convertedCount = 0;
    const convertedImages: Array<{ original: string; converted: string }> = [];

    const result = html.replace(
      /<img([^>]*?)src=("|')(.*?)(\2)([^>]*?)>/g,
      (_match, before, quote, src, _closingQuote, after) => {
        const decodedSrc = this.decodeHtmlEntities(src);
        if (!this.isLocalImageSource(decodedSrc)) {
          return `<img${before}src=${quote}${src}${quote}${after}>`;
        }

        const normalized = decodedSrc.replace(/\\/g, "/");
        const converted = convertFileSrc(normalized);
        convertedCount++;
        convertedImages.push({ original: decodedSrc, converted });
        return `<img${before}src=${quote}${converted}${quote}${after}>`;
      },
    );

    if (convertedCount > 0) {
      pushDevLog("info", "markdown-render", `渲染时转换了 ${convertedCount} 张本地图片路径`, {
        convertedCount,
        images: convertedImages,
      });
    }

    return result;
  }

  private static isLocalImageSource(src: string): boolean {
    // Match Windows absolute paths (C:/, D:\, etc.)
    // Match Unix absolute paths (/home/, /tmp/, /Users/, etc.) — but not protocol-relative URLs (//cdn.example.com)
    // Match file:// protocol URLs
    // Also match paths that may have been partially HTML-encoded
    return /^(?:[a-zA-Z]:[\\/])/.test(src) ||
           /^\/(?!\/)[^\s]/.test(src) ||
           /^file:\/\//.test(src) ||
           /^(?:[a-zA-Z]:&#47;)/.test(src) ||
           /^&#47;(?!&#47;)/.test(src) ||
           /^file:&#47;&#47;/.test(src);
  }

  /** Add target="_blank" rel="noopener noreferrer" to all <a> tags */
  private static addTargetBlankToLinks(html: string): string {
    return html.replace(
      /<a\s+([^>]*?)href=("|')(.*?)\2([^>]*)>/g,
      (_match, before, _quote, href, after) => {
        // Skip anchor links
        if (href.startsWith("#") || href.startsWith("javascript:")) {
          return _match;
        }
        // Avoid duplicate target attributes
        if (/target\s*=/i.test(before + after)) {
          return _match;
        }
        return `<a ${before}href="${href}"${after} target="_blank" rel="noopener noreferrer">`;
      },
    );
  }
}
