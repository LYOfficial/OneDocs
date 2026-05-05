import { readFile } from "node:fs/promises";
import process from "node:process";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const pdfPath = process.env.PDF_PATH;

if (!pdfPath) {
  console.error("Missing PDF_PATH env var.");
  process.exit(1);
}

const data = new Uint8Array(await readFile(pdfPath));
const pdf = await getDocument({
  data,
  disableWorker: true,
  useSystemFonts: true,
  disableAutoFetch: true,
}).promise;

console.log(`Pages: ${pdf.numPages}`);

const maxPages = Math.min(pdf.numPages, 2);
let previewText = "";

for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();
  const pageText = textContent.items.map((item) => item.str).join(" ").trim();
  previewText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
}

console.log(previewText || "(no text detected)");
