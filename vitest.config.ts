import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    coverage: {
      enabled: true,
      include: ["packages/**/*.ts"],
      exclude: [],
      reporter: ["lcov"],
      provider: "istanbul",
    },
  },
});
