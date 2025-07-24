import { fileURLToPath } from "node:url";

import { describe } from "vitest";

import MarkdownIt from "../lib";
import generate from "./markdown-it-testgen";

describe("markdown-it", function () {
  const md = new MarkdownIt({
    html: true,
    langPrefix: "",
    typographer: true,
    linkify: true,
  });

  generate(fileURLToPath(new URL("fixtures/markdown-it", import.meta.url)), md);
});
