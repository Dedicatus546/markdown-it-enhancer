import Token from "../lib/token";
import MarkdownIt, {
  MarkdownIt as MarkdownItClass,
  MarkdownItPlugin,
} from "../lib";
// @ts-expect-error ignore
import forInline from "markdown-it-for-inline";
import { assert, describe, expect, it } from "vitest";

declare function forInline(
  md: MarkdownItClass,
  ruleName: string,
  tokenType: string,
  iterator: (tokenList: Array<Token>, i: number) => void,
): void;

describe("API", function () {
  it("constructor", async function () {
    // @ts-expect-error no-check
    expect(() => new MarkdownIt("bad preset")).throws();

    // options should override preset
    const md = new MarkdownIt("commonmark", { html: false });
    assert.strictEqual(await md.render("<!-- -->"), "<p>&lt;!-- --&gt;</p>\n");
  });

  it("configure coverage", async function () {
    const md = new MarkdownIt();

    // conditions coverage
    // @ts-expect-error ignore
    md.configure({});
    assert.strictEqual(await md.render("123"), "<p>123</p>\n");

    expect(() => md.configure()).throws();
  });

  it("plugin", async function () {
    let succeeded = false;

    const plugin: MarkdownItPlugin = function plugin(slf, opts) {
      if (opts === "bar") {
        succeeded = true;
      }
    };

    const md = new MarkdownIt();

    md.use(plugin, "foo");
    assert.strictEqual(succeeded, false);
    md.use(plugin, "bar");
    assert.strictEqual(succeeded, true);
  });

  it("highlight", async function () {
    const md = new MarkdownIt({
      highlight: function (str) {
        return "<pre><code>==" + str + "==</code></pre>";
      },
    });

    assert.strictEqual(
      await md.render("```\nhl\n```"),
      "<pre><code>==hl\n==</code></pre>\n",
    );
  });

  it("highlight escape by default", async function () {
    const md = new MarkdownIt({
      highlight: function () {
        return "";
      },
    });

    assert.strictEqual(
      await md.render("```\n&\n```"),
      "<pre><code>&amp;\n</code></pre>\n",
    );
  });

  it("highlight arguments", async function () {
    const md = new MarkdownIt({
      highlight: function (str, lang, attrs) {
        assert.strictEqual(lang, "a");
        assert.strictEqual(attrs, "b  c  d");
        return "<pre><code>==" + str + "==</code></pre>";
      },
    });

    assert.strictEqual(
      await md.render("``` a  b  c  d \nhl\n```"),
      "<pre><code>==hl\n==</code></pre>\n",
    );
  });

  it("force hardbreaks", async function () {
    const md = new MarkdownIt({ breaks: true });

    assert.strictEqual(await md.render("a\nb"), "<p>a<br>\nb</p>\n");
    md.set({ xhtmlOut: true });
    assert.strictEqual(await md.render("a\nb"), "<p>a<br />\nb</p>\n");
  });

  it("xhtmlOut enabled", async function () {
    const md = new MarkdownIt({ xhtmlOut: true });

    assert.strictEqual(await md.render("---"), "<hr />\n");
    assert.strictEqual(
      await md.render("![]()"),
      '<p><img src="" alt="" /></p>\n',
    );
    assert.strictEqual(await md.render("a  \\\nb"), "<p>a  <br />\nb</p>\n");
  });

  it("xhtmlOut disabled", async function () {
    const md = new MarkdownIt();

    assert.strictEqual(await md.render("---"), "<hr>\n");
    assert.strictEqual(
      await md.render("![]()"),
      '<p><img src="" alt=""></p>\n',
    );
    assert.strictEqual(await md.render("a  \\\nb"), "<p>a  <br>\nb</p>\n");
  });

  it("bulk enable/disable rules in different chains", function () {
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

  it("bulk enable/disable with errors control", function () {
    const md = new MarkdownIt();

    expect(() => md.enable(["link", "code", "invalid"])).throws();
    expect(() => md.disable(["link", "code", "invalid"])).throws();
    expect(() => md.enable(["link", "code"])).not.throws();
    expect(() => md.disable(["link", "code"])).not.throws();
  });

  it("bulk enable/disable should understand strings", async function () {
    const md = new MarkdownIt();

    md.disable("emphasis");
    assert(await md.renderInline("_foo_"), "_foo_");

    md.enable("emphasis");
    assert(await md.renderInline("_foo_"), "<em>foo</em>");
  });

  it("input type check", async function () {
    const md = new MarkdownIt();

    // @ts-expect-error no-check
    await expect(md.render(null)).rejects.toThrow(
      /Input data should be a String/,
    );
  });
});

describe("Plugins", function () {
  it("should not loop infinitely if all rules are disabled", async function () {
    const md = new MarkdownIt();

    md.inline.ruler.enableOnly([]);
    md.inline.ruler2.enableOnly([]);
    md.block.ruler.enableOnly([]);

    await expect(md.render(" - *foo*\n - `bar`")).rejects.toThrow(
      /none of the block rules matched/,
    );
  });

  it("should not loop infinitely if inline rule doesn't increment pos", async function () {
    const md = new MarkdownIt();

    md.inline.ruler.after("text", "custom", function (state /*, silent */) {
      if (state.src.charCodeAt(state.pos) !== 0x40 /* @ */) return false;
      return true;
    });

    expect(md.render("foo@bar")).rejects.toThrow(
      /inline rule didn't increment state.pos/,
    );
    expect(md.render("[foo@bar]()")).rejects.toThrow(
      /inline rule didn't increment state.pos/,
    );
  });

  it("should not loop infinitely if block rule doesn't increment pos", async function () {
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

    expect(md.render("foo\n@bar\nbaz")).rejects.toThrow(
      /block rule didn't increment state.line/,
    );
    expect(md.render("foo\n\n@bar\n\nbaz")).rejects.toThrow(
      /block rule didn't increment state.line/,
    );
  });
});

describe("Misc", function () {
  it("Should replace NULL characters", async function () {
    const md = new MarkdownIt();

    assert.strictEqual(
      await md.render("foo\u0000bar"),
      "<p>foo\uFFFDbar</p>\n",
    );
  });

  it("Should correctly parse strings without tailing \\n", async function () {
    const md = new MarkdownIt();

    assert.strictEqual(await md.render("123"), "<p>123</p>\n");
    assert.strictEqual(await md.render("123\n"), "<p>123</p>\n");

    assert.strictEqual(
      await md.render("    codeblock"),
      "<pre><code>codeblock\n</code></pre>\n",
    );
    assert.strictEqual(
      await md.render("    codeblock\n"),
      "<pre><code>codeblock\n</code></pre>\n",
    );
  });

  it("Should quickly exit on empty string", async function () {
    const md = new MarkdownIt();

    assert.strictEqual(await md.render(""), "");
  });

  it("Should parse inlines only", async function () {
    const md = new MarkdownIt();

    assert.strictEqual(await md.renderInline("a *b* c"), "a <em>b</em> c");
  });

  it("Renderer should have pluggable inline and block rules", async function () {
    const md = new MarkdownIt();

    md.renderer.rules.em_open = function () {
      return "<it>";
    };
    md.renderer.rules.em_close = function () {
      return "</it>";
    };
    md.renderer.rules.paragraph_open = function () {
      return "<par>";
    };
    md.renderer.rules.paragraph_close = function () {
      return "</par>";
    };

    assert.strictEqual(await md.render("*b*"), "<par><it>b</it></par>");
  });

  it("Zero preset should disable everything", async function () {
    const md = new MarkdownIt("zero");

    assert.strictEqual(await md.render("___foo___"), "<p>___foo___</p>\n");
    assert.strictEqual(await md.renderInline("___foo___"), "___foo___");

    md.enable("emphasis");

    assert.strictEqual(
      await md.render("___foo___"),
      "<p><em><strong>foo</strong></em></p>\n",
    );
    assert.strictEqual(
      await md.renderInline("___foo___"),
      "<em><strong>foo</strong></em>",
    );
  });

  it("Should correctly check block termination rules when those are disabled (#13)", async function () {
    const md = new MarkdownIt("zero");

    assert.strictEqual(await md.render("foo\nbar"), "<p>foo\nbar</p>\n");
  });

  it("Should render link target attr", async function () {
    const md = await new MarkdownIt().use(
      forInline,
      "target",
      "link_open",
      function (tokens, idx) {
        tokens[idx].attrPush(["target", "_blank"]);
      },
    );

    assert.strictEqual(
      await md.render("[foo](bar)"),
      '<p><a href="bar" target="_blank">foo</a></p>\n',
    );
  });

  it("Should normalize CR to LF", async function () {
    const md = new MarkdownIt();

    assert.strictEqual(
      await md.render("# test\r\r - hello\r - world\r"),
      await md.render("# test\n\n - hello\n - world\n"),
    );
  });

  it("Should normalize CR+LF to LF", async function () {
    const md = new MarkdownIt();

    assert.strictEqual(
      await md.render("# test\r\n\r\n - hello\r\n - world\r\n"),
      await md.render("# test\n\n - hello\n - world\n"),
    );
  });

  it("Should escape surrogate pairs (coverage)", async function () {
    const md = new MarkdownIt();

    assert.strictEqual(
      await md.render("\\\uD835\uDC9C"),
      "<p>\\\uD835\uDC9C</p>\n",
    );
    assert.strictEqual(await md.render("\\\uD835x"), "<p>\\\uD835x</p>\n");
    assert.strictEqual(await md.render("\\\uD835"), "<p>\\\uD835</p>\n");
  });
});

describe("Url normalization", function () {
  it("Should be overridable", async function () {
    const md = new MarkdownIt({ linkify: true });

    md.normalizeLink = function (url) {
      assert(url.match(/example\.com/), "wrong url passed");
      return "LINK";
    };
    md.normalizeLinkText = function (url) {
      assert(url.match(/example\.com/), "wrong url passed");
      return "TEXT";
    };

    assert.strictEqual(
      await md.render("foo@example.com"),
      '<p><a href="LINK">TEXT</a></p>\n',
    );
    assert.strictEqual(
      await md.render("http://example.com"),
      '<p><a href="LINK">TEXT</a></p>\n',
    );
    assert.strictEqual(
      await md.render("<foo@example.com>"),
      '<p><a href="LINK">TEXT</a></p>\n',
    );
    assert.strictEqual(
      await md.render("<http://example.com>"),
      '<p><a href="LINK">TEXT</a></p>\n',
    );
    assert.strictEqual(
      await md.render("[test](http://example.com)"),
      '<p><a href="LINK">test</a></p>\n',
    );
    assert.strictEqual(
      await md.render("![test](http://example.com)"),
      '<p><img src="LINK" alt="test"></p>\n',
    );
  });
});

describe("Links validation", function () {
  it("Override validator, disable everything", async function () {
    const md = new MarkdownIt({ linkify: true });

    md.validateLink = function () {
      return false;
    };

    assert.strictEqual(
      await md.render("foo@example.com"),
      "<p>foo@example.com</p>\n",
    );
    assert.strictEqual(
      await md.render("http://example.com"),
      "<p>http://example.com</p>\n",
    );
    assert.strictEqual(
      await md.render("<foo@example.com>"),
      "<p>&lt;foo@example.com&gt;</p>\n",
    );
    assert.strictEqual(
      await md.render("<http://example.com>"),
      "<p>&lt;http://example.com&gt;</p>\n",
    );
    assert.strictEqual(
      await md.render("[test](http://example.com)"),
      "<p>[test](http://example.com)</p>\n",
    );
    assert.strictEqual(
      await md.render("![test](http://example.com)"),
      "<p>![test](http://example.com)</p>\n",
    );
  });
});

describe("maxNesting", function () {
  it("Block parser should not nest above limit", async function () {
    // @ts-expect-error ignore
    const md = new MarkdownIt({ maxNesting: 2 });
    assert.strictEqual(
      await md.render(">foo\n>>bar\n>>>baz"),
      "<blockquote>\n<p>foo</p>\n<blockquote></blockquote>\n</blockquote>\n",
    );
  });

  it("Inline parser should not nest above limit", async function () {
    // @ts-expect-error ignore
    const md = new MarkdownIt({ maxNesting: 1 });
    assert.strictEqual(
      await md.render("[`foo`]()"),
      '<p><a href="">`foo`</a></p>\n',
    );
  });

  it("Inline nesting coverage", async function () {
    // @ts-expect-error ignore
    const md = new MarkdownIt({ maxNesting: 2 });
    assert.strictEqual(
      await md.render("[[[[[[[[[[[[[[[[[[foo]()"),
      "<p>[[[[[[[[[[[[[[[[[[foo]()</p>\n",
    );
  });
});

describe("smartquotes", function () {
  const md = new MarkdownIt({
    typographer: true,

    // all strings have different length to make sure
    // we didn't accidentally count the wrong one
    quotes: ["[[[", "]]", "(((((", "))))"],
  });

  it("Should support multi-character quotes", async function () {
    assert.strictEqual(
      await md.render("\"foo\" 'bar'"),
      "<p>[[[foo]] (((((bar))))</p>\n",
    );
  });

  it("Should support nested multi-character quotes", async function () {
    assert.strictEqual(
      await md.render("\"foo 'bar' baz\""),
      "<p>[[[foo (((((bar)))) baz]]</p>\n",
    );
  });

  it("Should support multi-character quotes in different tags", async function () {
    assert.strictEqual(
      await md.render("\"a *b 'c *d* e' f* g\""),
      "<p>[[[a <em>b (((((c <em>d</em> e)))) f</em> g]]</p>\n",
    );
  });
});

describe("Ordered list info", function () {
  const md = new MarkdownIt();

  function type_filter(tokens: Array<Token>, type: string) {
    return tokens.filter(function (t) {
      return t.type === type;
    });
  }

  it("Should mark ordered list item tokens with info", async function () {
    let tokens = await md.parse("1. Foo\n2. Bar\n20. Fuzz");
    assert.strictEqual(type_filter(tokens, "ordered_list_open").length, 1);
    tokens = type_filter(tokens, "list_item_open");
    assert.strictEqual(tokens.length, 3);
    assert.strictEqual(tokens[0].info, "1");
    assert.strictEqual(tokens[0].markup, ".");
    assert.strictEqual(tokens[1].info, "2");
    assert.strictEqual(tokens[1].markup, ".");
    assert.strictEqual(tokens[2].info, "20");
    assert.strictEqual(tokens[2].markup, ".");

    tokens = await md.parse(" 1. Foo\n2. Bar\n  20. Fuzz\n 199. Flp");
    assert.strictEqual(type_filter(tokens, "ordered_list_open").length, 1);
    tokens = type_filter(tokens, "list_item_open");
    assert.strictEqual(tokens.length, 4);
    assert.strictEqual(tokens[0].info, "1");
    assert.strictEqual(tokens[0].markup, ".");
    assert.strictEqual(tokens[1].info, "2");
    assert.strictEqual(tokens[1].markup, ".");
    assert.strictEqual(tokens[2].info, "20");
    assert.strictEqual(tokens[2].markup, ".");
    assert.strictEqual(tokens[3].info, "199");
    assert.strictEqual(tokens[3].markup, ".");
  });
});

describe("Token attributes", function () {
  it(".attrJoin", async function () {
    const md = new MarkdownIt();

    const tokens = await md.parse("```");
    const t = tokens[0];

    t.attrJoin("class", "foo");
    t.attrJoin("class", "bar");

    assert.strictEqual(
      await md.renderer.render(tokens, md.options),
      '<pre><code class="foo bar"></code></pre>\n',
    );
  });

  it(".attrSet", async function () {
    const md = new MarkdownIt();

    const tokens = await md.parse("```");
    const t = tokens[0];

    t.attrSet("class", "foo");

    assert.strictEqual(
      await md.renderer.render(tokens, md.options),
      '<pre><code class="foo"></code></pre>\n',
    );

    t.attrSet("class", "bar");

    assert.strictEqual(
      await md.renderer.render(tokens, md.options),
      '<pre><code class="bar"></code></pre>\n',
    );
  });

  it(".attrGet", async function () {
    const md = new MarkdownIt();

    const tokens = await md.parse("```");
    const t = tokens[0];

    assert.strictEqual(t.attrGet("myattr"), null);

    t.attrSet("myattr", "myvalue");

    assert.strictEqual(t.attrGet("myattr"), "myvalue");
  });
});
