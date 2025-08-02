import { fileURLToPath } from "node:url";

import generate from "markdown-it-testgen-for-enhancer";
import { describe } from "vitest";

import MarkdownIt from "../src";

describe("markdown-it", function () {
  const md = new MarkdownIt({
    html: true,
    langPrefix: "",
    typographer: true,
    linkify: true,
  });

  // @ts-expect-error ignore
  generate(fileURLToPath(new URL("fixtures/markdown-it", import.meta.url)), md);
});
