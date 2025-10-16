/// <reference types="vitest/config" />

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ["src"],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src", "bare.ts"),
        full: resolve(__dirname, "src", "full.ts"),
        light: resolve(__dirname, "src", "light.ts"),
      },
      formats: ["es"],
    },
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: ["markdown-it-enhancer"],
    },
  },
  test: {
    globals: true,
    include: ["test/**/*.test.ts"],
    coverage: {
      enabled: true,
      include: ["src/**/*.ts"],
      reporter: ["html", "lcov"],
      provider: "istanbul",
    },
    ui: true,
  },
});
