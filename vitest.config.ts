import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["packages/**/*.test.ts"],
    coverage: {
      enabled: true,
      include: ["src/**/*.ts"],
      reporter: ["html", "lcov"],
      provider: "istanbul",
    },
    ui: true,
  },
});
