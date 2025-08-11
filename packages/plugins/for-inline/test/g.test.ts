import { fileURLToPath } from "node:url";

import { MarkdownIt } from "markdown-it-enhancer";
import { generate } from "markdown-it-enhancer-test-toolkit";
import { describe } from "vitest";

import { forInline } from "../src";

describe("markdown-it-for-inline", async () => {
  let md: MarkdownIt;

  md = new MarkdownIt().use(
    forInline,
    "text_replace",
    "text",
    (tokens, idx) => {
      tokens[idx].content = tokens[idx].content.replace(/foo/g, "bar");
    },
  );

  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/text.txt", import.meta.url)), md);

  md = new MarkdownIt({ linkify: true }).use(
    forInline,
    "link_replace",
    "link_open",
    (tokens, idx) => {
      if (
        tokens[idx + 2].type !== "link_close"
        || tokens[idx + 1].type !== "text"
      ) {
        return;
      }
      tokens[idx + 1].content = tokens[idx + 1].content
        .replace(/google/g, "shmugle")
        .replace(/^https?:\/\//, "")
        .replace(/^www./, "");
    },
  );

  await md.isReady();

  generate(fileURLToPath(new URL("fixtures/link.txt", import.meta.url)), md);
});
