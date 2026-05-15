import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const buildTargetEnv = process.env.VITE_BUILD_TARGET?.trim();
const buildTarget = (() => {
  if (!buildTargetEnv) {
    return ["es2021", "chrome100", "safari13"];
  }

  if (!buildTargetEnv.includes(",")) {
    return buildTargetEnv;
  }

  return buildTargetEnv.split(",").map((item) => item.trim()).filter(Boolean);
})();

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
