import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
  ],
  dts: {
    sourcemap: true,
  },
  sourcemap: true,
  target: "node20",
  alias: {
    "@": "./src",
  },
});
