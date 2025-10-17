import { fileURLToPath } from "node:url";

import { MarkdownIt } from "@markdown-it-enhancer/core";
import { generate } from "@markdown-it-enhancer/test-toolkit";
import { describe } from "vitest";

import { mark } from "../src";

describe("markdown-it-mark", async () => {
  const md = new MarkdownIt().use(mark);
  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/mark.txt", import.meta.url)), md);
});
