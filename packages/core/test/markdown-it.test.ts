import { fileURLToPath } from "node:url";

import { generate } from "@markdown-it-enhancer/test-toolkit";
import { describe } from "vitest";

import { MarkdownIt } from "../src";

describe("markdown-it", function () {
  const md = new MarkdownIt({
    html: true,
    langPrefix: "",
    typographer: true,
    linkify: true,
  });

  generate(
    fileURLToPath(new URL("fixtures/markdown-it", import.meta.url)),
    // @ts-expect-error ignore
    md,
  );
});
