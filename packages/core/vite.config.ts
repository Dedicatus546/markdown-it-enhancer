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
        index: resolve(__dirname, "src", "index.ts"),
        helpers: resolve(__dirname, "src", "helpers", "index.ts"),
        utils: resolve(__dirname, "src", "common", "utils.ts"),
        ucmicro: resolve(__dirname, "src", "ucmicro.ts"),
      },
      formats: ["es"],
    },
    minify: false,
    sourcemap: true,
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
