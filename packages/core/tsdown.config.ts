import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/helpers.ts",
    "src/utils.ts",
    "src/ucmicro.ts",
  ],
  dts: true,
  sourcemap: true,
  target: "node20",
  alias: {
    "@": "./src",
  },
});
