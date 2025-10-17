import { fileURLToPath } from "node:url";

import { MarkdownIt } from "@markdown-it-enhancer/core";
import { generate } from "@markdown-it-enhancer/test-toolkit";
import { describe } from "vitest";

import { container } from "../src";

describe("default container", async () => {
  const md = new MarkdownIt().use(container, "name", {});
  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/default.txt", import.meta.url)), md);
});
