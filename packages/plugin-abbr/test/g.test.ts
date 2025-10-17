import { fileURLToPath } from "node:url";

import { MarkdownIt } from "@markdown-it-enhancer/core";
import { generate } from "@markdown-it-enhancer/test-toolkit";
import { describe } from "vitest";

import { abbr } from "../src";

describe("markdown-it-abbr", async () => {
  const md = new MarkdownIt({ linkify: true }).use(abbr);
  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/abbr.txt", import.meta.url)), md);
});
