import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import pluginPrettierRecomended from "eslint-plugin-prettier/recommended";

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**"]),
  {
    files: ["lib/**/*.ts"],
    plugins: {
      js,
      "simple-import-sort": eslintPluginSimpleImportSort,
    },
    extends: ["js/recommended"],
    languageOptions: {
      // parser: tseslint.parser,
      globals: Object.assign({}, globals.node),
      // @ts-expect-error ignore
      parser: tseslint.parser,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
  {
    // @ts-expect-error ignore
    extends: [tseslint.configs.recommended],
    rules: {
      // "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
    },
  },
  pluginPrettierRecomended,
]);
