import { fileURLToPath } from "node:url";
import generate from "./markdown-it-testgen";
import MarkdownIt from "../lib";
import { describe } from "vitest";

describe("markdown-it", function () {
  const md = new MarkdownIt({
    html: true,
    langPrefix: "",
    typographer: true,
    linkify: true,
  });

  generate(fileURLToPath(new URL("fixtures/markdown-it", import.meta.url)), md);
});
