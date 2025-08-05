import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import katex from "katex";
import { MarkdownIt } from "markdown-it-enhancer";
import { load } from "markdown-it-enhancer-test-toolkit";
import { expect, it } from "vitest";

import { math } from "../src";
const __dirname = dirname(fileURLToPath(import.meta.url));

// ((tape = require("tape")),
//   (testLoad = require("markdown-it-testgen").load),
//   (mdk = require("../index")));

const md = new MarkdownIt();

await md.use(math, {}).isReady();

/* this uses the markdown-it-testgen module to automatically generate tests
   based on an easy to read text file
 */
load(join(__dirname, "fixtures/default.txt"), (data) => {
  data.fixtures.forEach((fixture) => {
    /* generic test definition code using tape */
    it(fixture.header, async () => {
      // t.plan(1);
      const expected = fixture.second.text;
      await expect(md.render(fixture.first.text)).resolves.toBe(expected);
    });
  });
});

it("katex render result should be equal to markdownit render result with plugin", async () => {
  const source = "1+1 = 2";
  const expected = katex.renderToString(source);
  await expect(md.render(`$${source}$`)).resolves.toBe(`<p>${expected}</p>\n`);
});
