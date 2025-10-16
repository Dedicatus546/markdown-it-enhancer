import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/decode.ts",
    "src/escape.ts",
  ],
  dts: true,
  sourcemap: true,
  target: "node20",
  alias: {
    "@": "./src",
  },
});
