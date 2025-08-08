import path from "node:path";
import { fileURLToPath } from "node:url";

import { MarkdownIt, MarkdownItEnv } from "markdown-it-enhancer";
import { load } from "markdown-it-enhancer-test-toolkit";
import { describe, expect, it } from "vitest";

import { footnote } from "../src";

// Most of the rest of this is inlined from generate(), but modified
// so we can pass in an `env` object
function generate(fixturePath: string, md: MarkdownIt, env?: MarkdownItEnv) {
  load(fixturePath, (data) => {
    const desc = path.relative(fixturePath, data.file);
    describe(desc, () => {
      data.fixtures.forEach((fixture) => {
        it("line " + (fixture.first.range[0] - 1), async () => {
          // add variant character after "↩", so we don't have to worry about
          // invisible characters in tests
          await expect(md.render(fixture.first.text, env ?? {})).resolves.toBe(
            fixture.second.text.replace(/\u21a9(?!\ufe0e)/g, "\u21a9\ufe0e"),
          );
        });
      });
    });
  });
}

describe("footnote.txt", async () => {
  const md = new MarkdownIt({ linkify: true }).use(footnote);
  await md.isReady();

  // Check that defaults work correctly
  generate(
    fileURLToPath(new URL("fixtures/footnote.txt", import.meta.url)),
    md,
  );
});

describe("custom docId in env", async () => {
  const md = new MarkdownIt().use(footnote);
  await md.isReady();

  // Now check that using `env.documentId` works to prefix IDs
  generate(
    fileURLToPath(new URL("fixtures/footnote-prefixed.txt", import.meta.url)),
    md,
    { docId: "test-doc-id" },
  );
});
