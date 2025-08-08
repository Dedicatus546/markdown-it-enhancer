import { fileURLToPath } from "node:url";

import { MarkdownIt } from "markdown-it-enhancer";
import { generate } from "markdown-it-enhancer-test-toolkit";
import { describe } from "vitest";

import { deflist } from "../src";

describe("markdown-it-deflist", async () => {
  const md = new MarkdownIt().use(deflist);
  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/deflist.txt", import.meta.url)), md);
});
