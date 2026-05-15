import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const buildTarget = process.env.VITE_BUILD_TARGET
  ? process.env.VITE_BUILD_TARGET.includes(",")
    ? process.env.VITE_BUILD_TARGET.split(",").map((item) => item.trim()).filter(Boolean)
    : process.env.VITE_BUILD_TARGET.trim()
  : ["es2021", "chrome100", "safari13"];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    fs: {
      allow: [".."],
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  optimizeDeps: {
    exclude: ["pdfjs-dist"],
  },
  build: {
    target: buildTarget,
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ["pdfjs-dist"],
        },
      },
    },
  },
});
