import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const buildTargetEnv = process.env.VITE_BUILD_TARGET?.trim();
const isAndroid = process.env.TAURI_ENV_PLATFORM === "android";
const buildTarget = (() => {
  if (buildTargetEnv) {
    if (!buildTargetEnv.includes(",")) {
      return buildTargetEnv;
    }
    return buildTargetEnv.split(",").map((item) => item.trim()).filter(Boolean);
  }

  // Android WebView on older devices doesn't support esnext/chrome120
  // Chrome 70 covers Android 10+; es2021 is widely supported
  if (isAndroid) {
    return ["es2021", "chrome70"];
  }

  return ["esnext", "chrome120", "safari17"];
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
