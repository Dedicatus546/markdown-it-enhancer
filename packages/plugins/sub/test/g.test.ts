import { fileURLToPath } from "node:url";

import { MarkdownIt } from "markdown-it-enhancer";
import generate from "markdown-it-enhancer-test-toolkit";
import { describe } from "vitest";

import { sub } from "../src";

// TODO: these are parsed incorrectly:
//
// ~~~foo~~~
// ~~~foo~ bar~~

describe("markdown-it-sub", async () => {
  const md = new MarkdownIt().use(sub);
  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/sub.txt", import.meta.url)), md);
});
