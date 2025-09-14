import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import solidPlugin from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";
import webfontDownload from 'vite-plugin-webfont-dl';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async ({command}) => ({
  plugins: [solid(), solidPlugin(), suidPlugin(), webfontDownload()],

  build: {
    target: "esnext",
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  esbuild: {
    drop: command === "build" 
      ? ["console", "debugger"] as ("console" | "debugger")[] 
      : [],
  },

  resolve: {
    alias: {
      "@src": resolve(__dirname, "./src")
    }
  },
}));
