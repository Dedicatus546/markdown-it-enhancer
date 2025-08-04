import { relative } from "node:path";
import { fileURLToPath } from "node:url";

import { load } from "markdown-it-enhancer-test-toolkit";
import { describe, expect, it } from "vitest";

import { MarkdownIt } from "../src";

const normalize = (text: string) => {
  return text.replace(
    /<blockquote>\n<\/blockquote>/g,
    "<blockquote></blockquote>",
  );
};

function generate(path: string, md: MarkdownIt) {
  load(path, function (data) {
    data.meta = data.meta || {};
    const recordMeta = data.meta as Record<string, string>;

    const desc = recordMeta.desc || relative(path, data.file);

    (recordMeta.skip ? describe.skip : describe)(desc, () => {
      data.fixtures.forEach((fixture) => {
        it(
          fixture.header
            ? fixture.header
            : "line " + (fixture.first.range[0] - 1),
          async () => {
            const target = normalize(fixture.second.text);
            await expect(md.render(fixture.first.text)).resolves.toBe(target);
          },
        );
      });
    });
  });
}

describe("CommonMark", () => {
  const md = new MarkdownIt("commonmark");

  generate(
    fileURLToPath(new URL("fixtures/commonmark/good.txt", import.meta.url)),
    md,
  );
});
