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
      include: ["lib"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "lib", "index.ts"),
      formats: ["es"],
    },
    minify: false,
  },
  test: {
    // 
    globals: true,
    include: [
      "test/**/utils.test.ts",
      "test/**/token.test.ts",
      "test/**/ruler.test.ts",
      "test/**/misc.test.ts",
      "test/**/commonmark.test.ts",
      "test/**/markdown-it.test.ts",
    ],
  },
});
