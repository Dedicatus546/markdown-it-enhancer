import { MarkdownIt, TokenNesting } from "markdown-it-enhancer";
import { describe, expect, it } from "vitest";

import { container } from "../src";

describe("api", () => {
  it("renderer", async () => {
    const md = new MarkdownIt().use(container, "spoiler", {
      render: function (tokens, idx) {
        return tokens[idx].nesting === TokenNesting.OPENING
          ? "<details><summary>click me</summary>\n"
          : "</details>\n";
      },
    });
    await md.isReady();
    await expect(md.render("::: spoiler\n*content*\n:::\n")).resolves.toBe(
      "<details><summary>click me</summary>\n<p><em>content</em></p>\n</details>\n",
    );
  });

  it("2 char marker", async () => {
    const md = new MarkdownIt().use(container, "spoiler", {
      marker: "->",
    });
    await md.isReady();
    await expect(
      md.render("->->-> spoiler\n*content*\n->->->\n"),
    ).resolves.toBe("<div class=\"spoiler\">\n<p><em>content</em></p>\n</div>\n");
  });

  it("marker should not collide with fence", async () => {
    const md = new MarkdownIt().use(container, "spoiler", {
      marker: "`",
    });
    await md.isReady();
    await expect(md.render("``` spoiler\n*content*\n```\n")).resolves.toBe(
      "<div class=\"spoiler\">\n<p><em>content</em></p>\n</div>\n",
    );
  });

  it("marker should not collide with fence #2", async () => {
    const md = new MarkdownIt().use(container, "spoiler", {
      marker: "`",
    });
    await md.isReady();
    await expect(
      md.render("\n``` not spoiler\n*content*\n```\n"),
    ).resolves.toBe(
      "<pre><code class=\"language-not\">*content*\n</code></pre>\n",
    );
  });

  describe("validator", function () {
    it("should skip rule if return value is falsy", async () => {
      const md = new MarkdownIt().use(container, "name", {
        validate: () => false,
      });
      await md.isReady();

      await expect(md.render(":::foo\nbar\n:::\n")).resolves.toBe(
        "<p>:::foo\nbar\n:::</p>\n",
      );
    });

    it("should accept rule if return value is true", async () => {
      const md = new MarkdownIt().use(container, "name", {
        validate: () => true,
      });
      await md.isReady();

      await expect(md.render(":::foo\nbar\n:::\n")).resolves.toBe(
        "<div class=\"name\">\n<p>bar</p>\n</div>\n",
      );
    });

    it("rule should call it", async () => {
      let count = 0;

      const md = new MarkdownIt().use(container, "name", {
        validate: () => (count++, false),
      });
      await md.isReady();
      await md.parse(":\n::\n:::\n::::\n:::::\n", {});

      // called by paragraph and lheading 3 times each
      expect(count > 0).toBeTruthy();
      expect(count % 3 === 0).toBeTruthy();
    });

    it("should not trim params", async () => {
      const md = new MarkdownIt().use(container, "name", {
        validate: p => (expect(p).toBe(" \tname "), true),
      });
      await md.isReady();
      await md.parse("::: \tname \ncontent\n:::\n");
    });

    it("should allow analyze mark", async () => {
      const md = new MarkdownIt().use(container, "name", {
        validate: (__, mark) => mark.length >= 4,
      });
      await md.isReady();

      await expect(md.render(":::\nfoo\n:::\n")).resolves.toBe(
        "<p>:::\nfoo\n:::</p>\n",
      );
      await expect(md.render("::::\nfoo\n::::\n")).resolves.toBe(
        "<div class=\"name\">\n<p>foo</p>\n</div>\n",
      );
    });
  });
});
