// @ts-expect-error ignore
import forInline from "markdown-it-for-inline";
import { assert, describe, expect, it } from "vitest";

import { MarkdownIt, type MarkdownItPlugin, type Token } from "../src";

declare function forInline(
  md: MarkdownIt,
  ruleName: string,
  tokenType: string,
  iterator: (tokenList: Array<Token>, i: number) => void,
): void;

describe("API", () => {
  it("constructor", async () => {
    // @ts-expect-error no-check
    expect(() => new MarkdownIt("bad preset")).throws();

    // options should override preset
    const md = new MarkdownIt("commonmark", { html: false });
    await expect(md.render("<!-- -->")).resolves.toBe(
      "<p>&lt;!-- --&gt;</p>\n",
    );
  });

  it("configure coverage", async () => {
    const md = new MarkdownIt();

    // conditions coverage
    // @ts-expect-error ignore
    md.configure({});
    await expect(md.render("123")).resolves.toBe("<p>123</p>\n");

    expect(() => md.configure()).throws();
  });

  it("plugin", async () => {
    let succeeded = false;

    const plugin: MarkdownItPlugin<[string]> = (md, opts) => {
      if (opts === "bar") {
        succeeded = true;
      }
    };

    const md = new MarkdownIt();

    await md.use(plugin, "foo").isReady();
    expect(succeeded).toBe(false);
    await md.use(plugin, "bar").isReady();
    expect(succeeded).toBe(true);
  });

  it("highlight", async () => {
    const md = new MarkdownIt({
      highlight(str) {
        return "<pre><code>==" + str + "==</code></pre>";
      },
    });

    await expect(md.render("```\nhl\n```")).resolves.toBe(
      "<pre><code>==hl\n==</code></pre>\n",
    );
  });

  it("highlight escape by default", async () => {
    const md = new MarkdownIt({
      highlight() {
        return "";
      },
    });

    await expect(md.render("```\n&\n```")).resolves.toBe(
      "<pre><code>&amp;\n</code></pre>\n",
    );
  });

  it("highlight arguments", async () => {
    const md = new MarkdownIt({
      highlight(str, lang, attrs) {
        expect(lang).toBe("a");
        expect(attrs).toBe("b  c  d");
        return "<pre><code>==" + str + "==</code></pre>";
      },
    });

    await expect(md.render("``` a  b  c  d \nhl\n```")).resolves.toBe(
      "<pre><code>==hl\n==</code></pre>\n",
    );
  });

  it("force hardbreaks", async () => {
    const md = new MarkdownIt({ breaks: true });

    assert.strictEqual(await md.render("a\nb"), "<p>a<br>\nb</p>\n");
    md.set({ xhtmlOut: true });
    assert.strictEqual(await md.render("a\nb"), "<p>a<br />\nb</p>\n");
  });

  it("xhtmlOut enabled", async () => {
    const md = new MarkdownIt({ xhtmlOut: true });

    assert.strictEqual(await md.render("---"), "<hr />\n");
    assert.strictEqual(
      await md.render("![]()"),
      '<p><img src="" alt="" /></p>\n',
    );
    assert.strictEqual(await md.render("a  \\\nb"), "<p>a  <br />\nb</p>\n");
  });

  it("xhtmlOut disabled", async () => {
    const md = new MarkdownIt();

    assert.strictEqual(await md.render("---"), "<hr>\n");
    assert.strictEqual(
      await md.render("![]()"),
      '<p><img src="" alt=""></p>\n',
    );
    assert.strictEqual(await md.render("a  \\\nb"), "<p>a  <br>\nb</p>\n");
  });

  it("bulk enable/disable rules in different chains", () => {
    const md = new MarkdownIt();

    const was = {
      core: md.core.ruler.getRules("").length,
      block: md.block.ruler.getRules("").length,
      inline: md.inline.ruler.getRules("").length,
    };

    // Disable 2 rule in each chain & compare result
    md.disable(["block", "inline", "code", "fence", "emphasis", "entity"]);

    const now = {
      core: md.core.ruler.getRules("").length + 2,
      block: md.block.ruler.getRules("").length + 2,
      inline: md.inline.ruler.getRules("").length + 2,
    };

    assert.deepEqual(was, now);

    // Enable the same rules back
    md.enable(["block", "inline", "code", "fence", "emphasis", "entity"]);

    const back = {
      core: md.core.ruler.getRules("").length,
      block: md.block.ruler.getRules("").length,
      inline: md.inline.ruler.getRules("").length,
    };

    assert.deepEqual(was, back);
  });

  it("bulk enable/disable with errors control", () => {
    const md = new MarkdownIt();

    expect(() => md.enable(["link", "code", "invalid"])).throws();
    expect(() => md.disable(["link", "code", "invalid"])).throws();
    expect(() => md.enable(["link", "code"])).not.throws();
    expect(() => md.disable(["link", "code"])).not.throws();
  });

  it("bulk enable/disable should understand strings", async () => {
    const md = new MarkdownIt();

    md.disable("emphasis");
    assert(await md.renderInline("_foo_"), "_foo_");

    md.enable("emphasis");
    assert(await md.renderInline("_foo_"), "<em>foo</em>");
  });

  it("input type check", async () => {
    const md = new MarkdownIt();

    // @ts-expect-error no-check
    await expect(md.render(null)).rejects.toThrow(
      /Input data should be a String/,
    );
  });
});

describe("Plugins", () => {
  it("should not loop infinitely if all rules are disabled", async () => {
    const md = new MarkdownIt();

    md.inline.ruler.enableOnly([]);
    md.inline.ruler2.enableOnly([]);
    md.block.ruler.enableOnly([]);

    await expect(md.render(" - *foo*\n - `bar`")).rejects.toThrow(
      /none of the block rules matched/,
    );
  });

  it("should not loop infinitely if inline rule doesn't increment pos", async () => {
    const md = new MarkdownIt();

    md.inline.ruler.after("text", "custom", function (state /*, silent */) {
      if (state.src.charCodeAt(state.pos) !== 0x40 /* @ */) return false;
      return true;
    });

    await expect(md.render("foo@bar")).rejects.toThrow(
      /inline rule didn't increment state.pos/,
    );
    await expect(md.render("[foo@bar]()")).rejects.toThrow(
      /inline rule didn't increment state.pos/,
    );
  });

  it("should not loop infinitely if block rule doesn't increment pos", async () => {
    const md = new MarkdownIt();

    md.block.ruler.before(
      "paragraph",
      "custom",
      function (state, startLine /*, endLine, silent */) {
        const pos = state.bMarks[startLine] + state.tShift[startLine];
        if (state.src.charCodeAt(pos) !== 0x40 /* @ */) return false;
        return true;
      },
      { alt: ["paragraph"] },
    );

    await expect(md.render("foo\n@bar\nbaz")).rejects.toThrow(
      /block rule didn't increment state.line/,
    );
    await expect(md.render("foo\n\n@bar\n\nbaz")).rejects.toThrow(
      /block rule didn't increment state.line/,
    );
  });
});

describe("Misc", () => {
  it("Should replace NULL characters", async () => {
    const md = new MarkdownIt();

    await expect(md.render("foo\u0000bar")).resolves.toBe(
      "<p>foo\uFFFDbar</p>\n",
    );
  });

  it("Should correctly parse strings without tailing \\n", async () => {
    const md = new MarkdownIt();

    await expect(md.render("123")).resolves.toBe("<p>123</p>\n");
    await expect(md.render("123\n")).resolves.toBe("<p>123</p>\n");

    await expect(md.render("    codeblock")).resolves.toBe(
      "<pre><code>codeblock\n</code></pre>\n",
    );
    await expect(md.render("    codeblock\n")).resolves.toBe(
      "<pre><code>codeblock\n</code></pre>\n",
    );
  });

  it("Should quickly exit on empty string", async () => {
    const md = new MarkdownIt();

    await expect(md.render("")).resolves.toBe("");
  });

  it("Should parse inlines only", async () => {
    const md = new MarkdownIt();

    await expect(md.renderInline("a *b* c")).resolves.toBe("a <em>b</em> c");
  });

  it("Renderer should have pluggable inline and block rules", async () => {
    const md = new MarkdownIt();

    // @ts-expect-error ignore
    md.renderer.rules.em_open = () => {
      return "<it>";
    };
    // @ts-expect-error ignore
    md.renderer.rules.em_close = () => {
      return "</it>";
    };
    // @ts-expect-error ignore
    md.renderer.rules.paragraph_open = () => {
      return "<par>";
    };
    // @ts-expect-error ignore
    md.renderer.rules.paragraph_close = () => {
      return "</par>";
    };

    await expect(md.render("*b*")).resolves.toBe("<par><it>b</it></par>");
  });

  it("Zero preset should disable everything", async () => {
    const md = new MarkdownIt("zero");

    await expect(md.render("___foo___")).resolves.toBe("<p>___foo___</p>\n");
    await expect(md.renderInline("___foo___")).resolves.toBe("___foo___");

    md.enable("emphasis");

    await expect(md.render("___foo___")).resolves.toBe(
      "<p><em><strong>foo</strong></em></p>\n",
    );
    await expect(md.renderInline("___foo___")).resolves.toBe(
      "<em><strong>foo</strong></em>",
    );
  });

  it("Should correctly check block termination rules when those are disabled (#13)", async () => {
    const md = new MarkdownIt("zero");

    await expect(md.render("foo\nbar")).resolves.toBe("<p>foo\nbar</p>\n");
  });

  it("Should render link target attr", async () => {
    const md = new MarkdownIt().use(
      forInline,
      "target",
      "link_open",
      (tokens, idx) => {
        tokens[idx].attrPush(["target", "_blank"]);
      },
    );
    await md.isReady();

    await expect(md.render("[foo](bar)")).resolves.toBe(
      '<p><a href="bar" target="_blank">foo</a></p>\n',
    );
  });

  it("Should normalize CR to LF", async () => {
    const md = new MarkdownIt();

    const [v1, v2] = await Promise.all([
      md.render("# test\r\r - hello\r - world\r"),
      md.render("# test\n\n - hello\n - world\n"),
    ]);

    expect(v1).toBe(v2);
  });

  it("Should normalize CR+LF to LF", async () => {
    const md = new MarkdownIt();

    const [v1, v2] = await Promise.all([
      md.render("# test\r\n\r\n - hello\r\n - world\r\n"),
      md.render("# test\n\n - hello\n - world\n"),
    ]);

    expect(v1).toBe(v2);
  });

  it("Should escape surrogate pairs (coverage)", async () => {
    const md = new MarkdownIt();

    await expect(md.render("\\\uD835\uDC9C")).resolves.toBe(
      "<p>\\\uD835\uDC9C</p>\n",
    );
    await expect(md.render("\\\uD835x")).resolves.toBe("<p>\\\uD835x</p>\n");
    await expect(md.render("\\\uD835")).resolves.toBe("<p>\\\uD835</p>\n");
  });
});

describe("Url normalization", () => {
  it("Should be overridable", async () => {
    const md = new MarkdownIt({ linkify: true });

    md.normalizeLink = function (url) {
      assert(url.match(/example\.com/), "wrong url passed");
      return "LINK";
    };
    md.normalizeLinkText = function (url) {
      assert(url.match(/example\.com/), "wrong url passed");
      return "TEXT";
    };

    await expect(md.render("foo@example.com")).resolves.toBe(
      '<p><a href="LINK">TEXT</a></p>\n',
    );
    await expect(md.render("http://example.com")).resolves.toBe(
      '<p><a href="LINK">TEXT</a></p>\n',
    );
    await expect(md.render("<foo@example.com>")).resolves.toBe(
      '<p><a href="LINK">TEXT</a></p>\n',
    );
    await expect(md.render("<http://example.com>")).resolves.toBe(
      '<p><a href="LINK">TEXT</a></p>\n',
    );
    await expect(md.render("[test](http://example.com)")).resolves.toBe(
      '<p><a href="LINK">test</a></p>\n',
    );
    await expect(md.render("![test](http://example.com)")).resolves.toBe(
      '<p><img src="LINK" alt="test"></p>\n',
    );
  });
});

describe("Links validation", () => {
  it("Override validator, disable everything", async () => {
    const md = new MarkdownIt({ linkify: true });

    md.validateLink = () => {
      return false;
    };

    await expect(md.render("foo@example.com")).resolves.toBe(
      "<p>foo@example.com</p>\n",
    );
    await expect(md.render("http://example.com")).resolves.toBe(
      "<p>http://example.com</p>\n",
    );
    await expect(md.render("<foo@example.com>")).resolves.toBe(
      "<p>&lt;foo@example.com&gt;</p>\n",
    );
    await expect(md.render("<http://example.com>")).resolves.toBe(
      "<p>&lt;http://example.com&gt;</p>\n",
    );
    await expect(md.render("[test](http://example.com)")).resolves.toBe(
      "<p>[test](http://example.com)</p>\n",
    );
    await expect(md.render("![test](http://example.com)")).resolves.toBe(
      "<p>![test](http://example.com)</p>\n",
    );
  });
});

describe("maxNesting", () => {
  it("Block parser should not nest above limit", async () => {
    // @ts-expect-error ignore
    const md = new MarkdownIt({ maxNesting: 2 });
    await expect(md.render(">foo\n>>bar\n>>>baz")).resolves.toBe(
      "<blockquote>\n<p>foo</p>\n<blockquote></blockquote>\n</blockquote>\n",
    );
  });

  it("Inline parser should not nest above limit", async () => {
    // @ts-expect-error ignore
    const md = new MarkdownIt({ maxNesting: 1 });
    await expect(md.render("[`foo`]()")).resolves.toBe(
      '<p><a href="">`foo`</a></p>\n',
    );
  });

  it("Inline nesting coverage", async () => {
    // @ts-expect-error ignore
    const md = new MarkdownIt({ maxNesting: 2 });
    await expect(md.render("[[[[[[[[[[[[[[[[[[foo]()")).resolves.toBe(
      "<p>[[[[[[[[[[[[[[[[[[foo]()</p>\n",
    );
  });
});

describe("smartquotes", () => {
  const md = new MarkdownIt({
    typographer: true,

    // all strings have different length to make sure
    // we didn't accidentally count the wrong one
    quotes: ["[[[", "]]", "(((((", "))))"],
  });

  it("Should support multi-character quotes", async () => {
    await expect(md.render("\"foo\" 'bar'")).resolves.toBe(
      "<p>[[[foo]] (((((bar))))</p>\n",
    );
  });

  it("Should support nested multi-character quotes", async () => {
    await expect(md.render("\"foo 'bar' baz\"")).resolves.toBe(
      "<p>[[[foo (((((bar)))) baz]]</p>\n",
    );
  });

  it("Should support multi-character quotes in different tags", async () => {
    await expect(md.render("\"a *b 'c *d* e' f* g\"")).resolves.toBe(
      "<p>[[[a <em>b (((((c <em>d</em> e)))) f</em> g]]</p>\n",
    );
  });
});

describe("Ordered list info", () => {
  const md = new MarkdownIt();

  function type_filter(tokens: Array<Token>, type: string) {
    return tokens.filter(function (t) {
      return t.type === type;
    });
  }

  it("Should mark ordered list item tokens with info", async () => {
    let tokens = await md.parse("1. Foo\n2. Bar\n20. Fuzz");
    expect(type_filter(tokens, "ordered_list_open").length).toBe(1);
    tokens = type_filter(tokens, "list_item_open");
    expect(tokens.length).toBe(3);
    expect(tokens[0].info).toBe("1");
    expect(tokens[0].markup).toBe(".");
    expect(tokens[1].info).toBe("2");
    expect(tokens[1].markup).toBe(".");
    expect(tokens[2].info).toBe("20");
    expect(tokens[2].markup).toBe(".");

    tokens = await md.parse(" 1. Foo\n2. Bar\n  20. Fuzz\n 199. Flp");
    expect(type_filter(tokens, "ordered_list_open").length).toBe(1);
    tokens = type_filter(tokens, "list_item_open");
    expect(tokens.length).toBe(4);
    expect(tokens[0].info).toBe("1");
    expect(tokens[0].markup).toBe(".");
    expect(tokens[1].info).toBe("2");
    expect(tokens[1].markup).toBe(".");
    expect(tokens[2].info).toBe("20");
    expect(tokens[2].markup).toBe(".");
    expect(tokens[3].info).toBe("199");
    expect(tokens[3].markup).toBe(".");
  });
});

describe("Token attributes", () => {
  it(".attrJoin", async () => {
    const md = new MarkdownIt();

    const tokens = await md.parse("```");
    const t = tokens[0];

    t.attrJoin("class", "foo");
    t.attrJoin("class", "bar");

    await expect(md.renderer.render(tokens, md.options)).resolves.toBe(
      '<pre><code class="foo bar"></code></pre>\n',
    );
  });

  it(".attrSet", async () => {
    const md = new MarkdownIt();

    const tokens = await md.parse("```");
    const t = tokens[0];

    t.attrSet("class", "foo");

    await expect(md.renderer.render(tokens, md.options)).resolves.toBe(
      '<pre><code class="foo"></code></pre>\n',
    );

    t.attrSet("class", "bar");

    await expect(md.renderer.render(tokens, md.options)).resolves.toBe(
      '<pre><code class="bar"></code></pre>\n',
    );
  });

  it(".attrGet", async () => {
    const md = new MarkdownIt();

    const tokens = await md.parse("```");
    const t = tokens[0];

    expect(t.attrGet("myattr")).toBe(null);

    t.attrSet("myattr", "myvalue");

    expect(t.attrGet("myattr")).toBe("myvalue");
  });
});
