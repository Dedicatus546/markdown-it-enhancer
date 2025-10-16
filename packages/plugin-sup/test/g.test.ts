import { fileURLToPath } from "node:url";

import { MarkdownIt } from "markdown-it-enhancer";
import { generate } from "markdown-it-enhancer-test-toolkit";
import { describe } from "vitest";

import { sup } from "../src";

describe("markdown-it-sup", async () => {
  const md = new MarkdownIt().use(sup);
  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/sup.txt", import.meta.url)), md);
});
