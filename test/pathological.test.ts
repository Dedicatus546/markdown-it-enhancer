import crypto from "node:crypto";
import { assert, describe, it } from "vitest";
import MarkdownIt from "../lib";

const pathologicalMd5 = "80e12450752e4667b3656fa2cd12e9d5";

// 不再使用 jest worker ，vitest 默认多线程以及上下文隔离
async function render(str: string) {
  const markdownIt = new MarkdownIt();
  return markdownIt.render(str);
}

describe("Pathological sequences speed", () => {
  it("Integrity check", async () => {
    assert.strictEqual(await render("foo"), "<p>foo</p>\n");
  });

  // Ported from cmark, https://github.com/commonmark/cmark/blob/master/test/pathological_tests.py
  describe("Cmark", () => {
    it("verify original source crc", async () => {
      const src = await fetch(
        // "https://raw.githubusercontent.com/commonmark/cmark/master/test/pathological_tests.py",
        `https://fastly.jsdelivr.net/gh/commonmark/cmark@master/test/pathological_tests.py?v=${Date.now()}`,
        {
          method: "GET",
        },
      );
      const src_md5 = crypto
        .createHash("md5")
        .update(await src.text())
        .digest("hex");

      assert.strictEqual(
        src_md5,
        pathologicalMd5,
        "CRC or cmark pathological tests hanged. Verify and update pathological.json",
      );
    });

    it("nested inlines", async () => {
      await render("*".repeat(60000) + "a" + "*".repeat(60000));
    });

    it("nested strong emph", async () => {
      await render("*a **a ".repeat(5000) + "b" + " a** a*".repeat(5000));
    });

    it("many emph closers with no openers", async () => {
      await render("a_ ".repeat(30000));
    });

    it("many emph openers with no closers", async () => {
      await render("_a ".repeat(30000));
    });

    it("many link closers with no openers", async () => {
      await render("a]".repeat(10000));
    });

    it("many link openers with no closers", async () => {
      await render("[a".repeat(10000));
    });

    it("mismatched openers and closers", async () => {
      await render("*a_ ".repeat(50000));
    });

    it("commonmark/cmark#389", async () => {
      await render("*a ".repeat(20000) + "_a*_ ".repeat(20000));
    });

    it("openers and closers multiple of 3", async () => {
      await render("a**b" + "c* ".repeat(50000));
    });

    it("link openers and emph closers", async () => {
      await render("[ a_".repeat(10000));
    });

    it("pattern [ (]( repeated", async () => {
      await render("[ (](".repeat(40000));
    });

    it("pattern ![[]() repeated", async () => {
      await render("![[]()".repeat(20000));
    });

    it("nested brackets", async () => {
      await render("[".repeat(20000) + "a" + "]".repeat(20000));
    });

    it("nested block quotes", async () => {
      await render("> ".repeat(50000) + "a");
    });

    it("deeply nested lists", async () => {
      await render(
        Array(1000)
          .fill(0)
          .map(function (_, x) {
            return "  ".repeat(x) + "* a\n";
          })
          .join(""),
      );
    });

    it("U+0000 in input", async () => {
      await render("abc\u0000de\u0000".repeat(100000));
    });

    it("backticks", async () => {
      await render(
        Array(3000)
          .fill(0)
          .map(function (_, x) {
            return "e" + "`".repeat(x);
          })
          .join(""),
      );
    });

    it("unclosed links A", async () => {
      await render("[a](<b".repeat(30000));
    });

    it("unclosed links B", async () => {
      await render("[a](b".repeat(30000));
    });

    it("unclosed <!--", async () => {
      await render("</" + "<!--".repeat(100000));
    });

    it("empty lines in deeply nested lists", async () => {
      await render("- ".repeat(30000) + "x" + "\n".repeat(30000));
    });

    it("empty lines in deeply nested lists in blockquote", async () => {
      await render("> " + "- ".repeat(30000) + "x\n" + ">\n".repeat(30000));
    });

    it("emph in deep blockquote", async () => {
      await render(">".repeat(100000) + "a*".repeat(100000));
    });
  });

  describe("Markdown-it", () => {
    it("emphasis **_* pattern", async () => {
      await render("**_* ".repeat(50000));
    });

    it("backtick ``\\``\\`` pattern", async () => {
      await render("``\\".repeat(50000));
    });

    it("autolinks <<<<...<<> pattern", async () => {
      await render("<".repeat(400000) + ">");
    });

    it("hardbreak whitespaces pattern", async () => {
      await render("x" + " ".repeat(150000) + "x  \nx");
    });
  });
});
