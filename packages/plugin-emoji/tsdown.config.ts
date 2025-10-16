import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/bare.ts",
    "src/full.ts",
    "src/light.ts",
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
