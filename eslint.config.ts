import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import pluginPrettierRecomended from "eslint-plugin-prettier/recommended";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config([
  globalIgnores([
    "**/coverage",
    "**/dist",
    "**/node_modules",
    "**/.git",
    "**/*.js",
  ]),
  {
    files: ["packages/**/*.ts"],
  },
  {
    plugins: {
      "simple-import-sort": eslintPluginSimpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    extends: [js.configs.recommended],
    rules: {
      curly: "error",
    },
  },
  {
    extends: [tseslint.configs.recommendedTypeChecked],
    rules: {
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
    },
  },
  {
    languageOptions: {
      globals: Object.assign({}, globals.node),
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  pluginPrettierRecomended,
]);
