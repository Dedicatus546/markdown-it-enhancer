import { fileURLToPath } from "node:url";

import { MarkdownIt } from "markdown-it-enhancer";
import { generate } from "markdown-it-enhancer-test-toolkit";
import { describe } from "vitest";

import { ins } from "../src";

describe("markdown-it-ins", function () {
  const md = new MarkdownIt().use(ins);

  generate(fileURLToPath(new URL("fixtures/ins.txt", import.meta.url)), md);
});
