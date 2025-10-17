import { MarkdownIt } from "@markdown-it-enhancer/core";
import { implicitFigures } from "@markdown-it-enhancer/plugin-implicit-figures";
import { math } from "@markdown-it-enhancer/plugin-katex";
import { describe, expect, it } from "vitest";

import { attributes } from "../src";
import type { AttributeNormalizedOptions } from "../src/types";
import { escapeHtml, getAttrs, hasDelimiters } from "../src/utils";

describeTestsWithOptions(
  {
    leftDelimiter: "{",
    rightDelimiter: "}",
  },
  "",
);

describeTestsWithOptions(
  {
    leftDelimiter: "[",
    rightDelimiter: "]",
  },
  " with [ ] delimiters",
);

describeTestsWithOptions(
  {
    leftDelimiter: "[[",
    rightDelimiter: "]]",
  },
  " with [[ ]] delimiters",
);

describe("markdown-it-attrs", () => {
  it("should not throw when getting only allowedAttributes option", async () => {
    const md = new MarkdownIt();
    await md
      .use(attributes, { allowedAttributes: [/^(class|attr)$/] })
      .isReady();
    const src = "text {.someclass #someid attr=allowed}";
    const expected = "<p class=\"someclass\" attr=\"allowed\">text</p>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });
});

type describeTestsOptions = Pick<
  AttributeNormalizedOptions,
  "leftDelimiter" | "rightDelimiter"
>;

function describeTestsWithOptions(
  options: describeTestsOptions,
  postText: string,
) {
  describe("markdown-it-attrs.utils" + postText, () => {
    it(
      replaceDelimiters(
        "should parse {.class ..css-module #id key=val .class.with.dot}",
        options,
      ),
      () => {
        const src = "{.red ..mod #head key=val .class.with.dot}";
        const expected = [
          ["class", "red"],
          ["css-module", "mod"],
          ["id", "head"],
          ["key", "val"],
          ["class", "class.with.dot"],
        ];
        const res = getAttrs(replaceDelimiters(src, options), 0, options);
        expect(res).toStrictEqual(expected);
      },
    );

    it(
      replaceDelimiters("should parse attributes with = {attr=/id=1}", options),
      () => {
        const src = "{link=/some/page/in/app/id=1}";
        const expected = [["link", "/some/page/in/app/id=1"]];
        const res = getAttrs(replaceDelimiters(src, options), 0, options);
        expect(res).toStrictEqual(expected);
      },
    );

    it(
      replaceDelimiters(
        "should parse attributes whose are ignored the key chars(\\t,\\n,\\f,\\s,/,>,\",',=) eg: {gt>=true slash/=trace i\\td \"q\\fnu e'r\\ny\"=}",
        options,
      ),
      () => {
        const src = "{gt>=true slash/=trace i\td \"q\fu\ne'r\ny\"=}";
        const expected = [
          ["gt", "true"],
          ["slash", "trace"],
          ["id", ""],
          ["query", ""],
        ];
        const res = getAttrs(replaceDelimiters(src, options), 0, options);
        expect(res).toStrictEqual(expected);
      },
    );

    it(
      replaceDelimiters(
        "should throw an error while calling `hasDelimiters` with an invalid `where` param",
        options,
      ),
      () => {
        expect(
          // @ts-expect-error ignore
          () => hasDelimiters(0, options),
        ).toThrowError(
          new Error(
            "Parameter `where` not passed. Should be \"start\", \"end\" or \"only\".",
          ),
        );
        expect(
          // @ts-expect-error ignore
          () => hasDelimiters("", options),
        ).toThrowError(
          new Error(
            "Parameter `where` not passed. Should be \"start\", \"end\" or \"only\".",
          ),
        );
        expect(
          // @ts-expect-error ignore
          () => hasDelimiters(null, options),
        ).toThrowError(
          new Error(
            "Parameter `where` not passed. Should be \"start\", \"end\" or \"only\".",
          ),
        );
        expect(
          // @ts-expect-error ignore
          () => hasDelimiters(undefined, options),
        ).toThrowError(
          new Error(
            "Parameter `where` not passed. Should be \"start\", \"end\" or \"only\".",
          ),
        );
        expect(
          // @ts-expect-error ignore
          () => hasDelimiters("center", options)("has {#test} delimiters"),
        ).toThrowError(
          new Error(
            "Unexpected case center, expected 'start', 'end' or 'only'",
          ),
        );
      },
    );

    it("should escape html entities(&,<,>,\") eg: <a href=\"?a&b\">TOC</a>", () => {
      const src = "<a href=\"a&b\">TOC</a>";
      const expected = "&lt;a href=&quot;a&amp;b&quot;&gt;TOC&lt;/a&gt;";
      const res = escapeHtml(src);
      expect(res).toBe(expected);
    });

    it("should keep the origional input which is not contains(&,<,>,\") char(s) eg: |a|b|", () => {
      const src = "|a|b|";
      const expected = "|a|b|";
      const res = escapeHtml(src);
      expect(res).toBe(expected);
    });
  });

  describe("markdown-it-attrs" + postText, () => {
    const createMarkdown = async () => {
      const md = new MarkdownIt();
      await md.use(attributes, options).isReady();
      return md;
    };

    it(
      replaceDelimiters(
        "should add attributes when {} in end of last inline",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {with=attrs}";
        const expected = "<p with=\"attrs\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should not add attributes when it has too many delimiters {{}}",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {{with=attrs}}";
        const expected = "<p>some text {{with=attrs}}</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          replaceDelimiters(expected, options),
        );
      },
    );

    it(
      replaceDelimiters("should add attributes when {} in last line", options),
      async () => {
        const md = await createMarkdown();
        const src = "some text\n{with=attrs}";
        const expected = "<p with=\"attrs\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should add classes with {.class} dot notation",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {.green}";
        const expected = "<p class=\"green\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should add css-modules with {..css-module} double dot notation",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {..green}";
        const expected = "<p css-module=\"green\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should add identifiers with {#id} hashtag notation",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {#section2}";
        const expected = "<p id=\"section2\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should support classes, css-modules, identifiers and attributes in same {}",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {attr=lorem .class ..css-module #id}";
        const expected
          = "<p attr=\"lorem\" class=\"class\" css-module=\"css-module\" id=\"id\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should support attributes inside \" {attr=\"lorem ipsum\"}",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {attr=\"lorem ipsum\"}";
        const expected = "<p attr=\"lorem ipsum\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should add classes in same class attribute {.c1 .c2} -> class=\"c1 c2\"",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {.c1 .c2}";
        const expected = "<p class=\"c1 c2\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should add css-modules in same css-modules attribute {..c1 ..c2} -> css-module=\"c1 c2\"",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {..c1 ..c2}";
        const expected = "<p css-module=\"c1 c2\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should add nested css-modules {..c1.c2} -> css-module=\"c1.c2\"",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "some text {..c1.c2}";
        const expected = "<p css-module=\"c1.c2\">some text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should support empty inline tokens", options),
      async () => {
        const md = await createMarkdown();
        const src = " 1 | 2 \n --|-- \n a | ";
        await md.render(replaceDelimiters(src, options)); // should not crash / throw error
      },
    );

    it(
      replaceDelimiters("should add classes to inline elements", options),
      async () => {
        const md = await createMarkdown();
        const src = "paragraph **bold**{.red} asdf";
        const expected
          = "<p>paragraph <strong class=\"red\">bold</strong> asdf</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should not add classes to inline elements with too many {{}}",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "paragraph **bold**{{.red}} asdf";
        const expected
          = "<p>paragraph <strong>bold</strong>{{.red}} asdf</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          replaceDelimiters(expected, options),
        );
      },
    );

    it(replaceDelimiters("should only remove last {}", options), async () => {
      const md = await createMarkdown();
      const src = "{{.red}";
      const expected = replaceDelimiters("<p class=\"red\">{</p>\n", options);
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it(
      replaceDelimiters("should add classes for list items", options),
      async () => {
        const md = await createMarkdown();
        const src = "- item 1{.red}\n- item 2";
        let expected = "<ul>\n";
        expected += "<li class=\"red\">item 1</li>\n";
        expected += "<li>item 2</li>\n";
        expected += "</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should add classes in nested lists", options),
      async () => {
        const md = await createMarkdown();
        let src = "- item 1{.a}\n";
        src += "  - nested item {.b}\n";
        src += "  {.c}\n";
        src += "    1. nested nested item {.d}\n";
        src += "    {.e}\n";
        // Adding class to top ul not supported
        //    src += '{.f}';
        //    expected = '<ul class="f">\n';
        let expected = "<ul>\n";
        expected += "<li class=\"a\">item 1\n";
        expected += "<ul class=\"c\">\n";
        expected += "<li class=\"b\">nested item\n";
        expected += "<ol class=\"e\">\n";
        expected += "<li class=\"d\">nested nested item</li>\n";
        expected += "</ol>\n";
        expected += "</li>\n";
        expected += "</ul>\n";
        expected += "</li>\n";
        expected += "</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should work with nested inline elements", options),
      async () => {
        const md = await createMarkdown();
        const src = "- **bold *italics*{.blue}**{.green}";
        let expected = "<ul>\n";
        expected
          += "<li><strong class=\"green\">bold <em class=\"blue\">italics</em></strong></li>\n";
        expected += "</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should add class to inline code block", options),
      async () => {
        const md = await createMarkdown();
        const src = "bla `click()`{.c}";
        const expected = "<p>bla <code class=\"c\">click()</code></p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should not trim unrelated white space", options),
      async () => {
        const md = await createMarkdown();
        const src = "- **bold** text {.red}";
        let expected = "<ul>\n";
        expected += "<li class=\"red\"><strong>bold</strong> text</li>\n";
        expected += "</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should not create empty attributes", options),
      async () => {
        const md = await createMarkdown();
        const src = "text { .red }";
        const expected = "<p class=\"red\">text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should add attributes to ul when below last bullet point",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "- item1\n- item2\n{.red}";
        const expected
          = "<ul class=\"red\">\n<li>item1</li>\n<li>item2</li>\n</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should add classes for both last list item and ul",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "- item{.red}\n{.blue}";
        let expected = "<ul class=\"blue\">\n";
        expected += "<li class=\"red\">item</li>\n";
        expected += "</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should add class ul after a \"softbreak\"", options),
      async () => {
        const md = await createMarkdown();
        const src = "- item\n{.blue}";
        let expected = "<ul class=\"blue\">\n";
        expected += "<li>item</li>\n";
        expected += "</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should ignore non-text \"attr-like\" text after a \"softbreak\"",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "- item\n*{.blue}*";
        let expected = "<ul>\n";
        expected += "<li>item\n<em>{.blue}</em></li>\n";
        expected += "</ul>\n";
        await expect(md.render(src)).resolves.toBe(expected);
      },
    );

    it(
      replaceDelimiters("should work with ordered lists", options),
      async () => {
        const md = await createMarkdown();
        const src = "1. item\n{.blue}";
        let expected = "<ol class=\"blue\">\n";
        expected += "<li>item</li>\n";
        expected += "</ol>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should work with typography enabled", options),
      async () => {
        const md = await createMarkdown();
        const src = "text {key=\"val with spaces\"}";
        const expected = "<p key=\"val with spaces\">text</p>\n";
        const res = await md
          .set({ typographer: true })
          .render(replaceDelimiters(src, options));
        expect(res).toBe(expected);
      },
    );

    it(replaceDelimiters("should support code blocks", options), async () => {
      const md = await createMarkdown();
      const src = "```{.c a=1 #ii}\nfor i in range(10):\n```";
      const expected
        = "<pre><code class=\"c\" a=\"1\" id=\"ii\">for i in range(10):\n</code></pre>\n";
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it(
      replaceDelimiters(
        "should support code blocks with language defined",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "```python {.c a=1 #ii}\nfor i in range(10):\n```";
        const expected
          = "<pre><code class=\"c language-python\" a=\"1\" id=\"ii\">for i in range(10):\n</code></pre>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(replaceDelimiters("should support blockquotes", options), async () => {
      const md = await createMarkdown();
      const src = "> quote\n{.c}";
      const expected = "<blockquote class=\"c\">\n<p>quote</p>\n</blockquote>\n";
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it(replaceDelimiters("should support tables", options), async () => {
      const md = await createMarkdown();
      let src = "| h1 | h2 |\n";
      src += "| -- | -- |\n";
      src += "| c1 | c1 |\n";
      src += "\n";
      src += "{.c}";
      let expected = "<table class=\"c\">\n";
      expected += "<thead>\n";
      expected += "<tr>\n";
      expected += "<th>h1</th>\n";
      expected += "<th>h2</th>\n";
      expected += "</tr>\n";
      expected += "</thead>\n";
      expected += "<tbody>\n";
      expected += "<tr>\n";
      expected += "<td>c1</td>\n";
      expected += "<td>c1</td>\n";
      expected += "</tr>\n";
      expected += "</tbody>\n";
      expected += "</table>\n";
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it(
      replaceDelimiters(
        "should apply attributes to the last column of tables",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        let src = "| title | title {.title-primar} |\n";
        src += "| :---: | :---: |\n";
        src += "| text | text {.text-primar} |\n";
        src += "| text {.text-primary} | text |\n";
        src += "\n";
        src += "{.c}";
        let expected = "<table class=\"c\">\n";
        expected += "<thead>\n";
        expected += "<tr>\n";
        expected += "<th style=\"text-align:center\">title</th>\n";
        expected
          += "<th style=\"text-align:center\" class=\"title-primar\">title</th>\n";
        expected += "</tr>\n";
        expected += "</thead>\n";
        expected += "<tbody>\n";
        expected += "<tr>\n";
        expected += "<td style=\"text-align:center\">text</td>\n";
        expected
          += "<td style=\"text-align:center\" class=\"text-primar\">text</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected
          += "<td style=\"text-align:center\" class=\"text-primary\">text</td>\n";
        expected += "<td style=\"text-align:center\">text</td>\n";
        expected += "</tr>\n";
        expected += "</tbody>\n";
        expected += "</table>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters(
        "should caculate table's colspan and/or rowspan",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        let src = "| A | B | C | D |\n";
        src += "| -- | -- | -- | -- |\n";
        src += "| 1 | 11 | 111 | 1111 {rowspan=3} |\n";
        src += "| 2 {colspan=2 rowspan=2} | 22 | 222 | 2222 |\n";
        src += "| 3 | 33 | 333 | 3333 |\n";
        src += "\n";
        src += "{border=1}\n";
        src += "| A |\n";
        src += "| -- |\n";
        src += "| 1 {colspan=3}|\n";
        src += "| 2 |\n";
        src += "| 3 |\n";
        src += "\n";
        src += "{border=2}\n";
        src += "| A | B | C |\n";
        src += "| -- | -- | -- |\n";
        src += "| 1 {rowspan=2}| 11 | 111 |\n";
        src += "| 2 {rowspan=2}| 22 | 222 |\n";
        src += "| 3 | 33 | 333 |\n";
        src += "\n";
        src += "{border=3}\n";
        src += "| A | B | C | D |\n";
        src += "| -- | -- | -- | -- |\n";
        src += "| 1 {colspan=2}| 11 {colspan=3} | 111| 1111 |\n";
        src += "| 2 {rowspan=2} | 22 {colspan=2} | 222 | 2222 |\n";
        src += "| 3 | 33 {colspan=4} | 333 | 3333 |\n";
        src += "\n";
        src += "{border=4}";
        let expected = "<table border=\"1\">\n";
        expected += "<thead>\n";
        expected += "<tr>\n";
        expected += "<th>A</th>\n";
        expected += "<th>B</th>\n";
        expected += "<th>C</th>\n";
        expected += "<th>D</th>\n";
        expected += "</tr>\n";
        expected += "</thead>\n";
        expected += "<tbody>\n";
        expected += "<tr>\n";
        expected += "<td>1</td>\n";
        expected += "<td>11</td>\n";
        expected += "<td>111</td>\n";
        expected += "<td rowspan=\"3\">1111</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected += "<td colspan=\"2\" rowspan=\"2\">2</td>\n";
        expected += "<td>22</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected += "<td>3</td>\n";
        expected += "</tr>\n";
        expected += "</tbody>\n";
        expected += "</table>\n";
        expected += "<table border=\"2\">\n";
        expected += "<thead>\n";
        expected += "<tr>\n";
        expected += "<th>A</th>\n";
        expected += "</tr>\n";
        expected += "</thead>\n";
        expected += "<tbody>\n";
        expected += "<tr>\n";
        expected += "<td colspan=\"3\">1</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected += "<td>2</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected += "<td>3</td>\n";
        expected += "</tr>\n";
        expected += "</tbody>\n";
        expected += "</table>\n";
        expected += "<table border=\"3\">\n";
        expected += "<thead>\n";
        expected += "<tr>\n";
        expected += "<th>A</th>\n";
        expected += "<th>B</th>\n";
        expected += "<th>C</th>\n";
        expected += "</tr>\n";
        expected += "</thead>\n";
        expected += "<tbody>\n";
        expected += "<tr>\n";
        expected += "<td rowspan=\"2\">1</td>\n";
        expected += "<td>11</td>\n";
        expected += "<td>111</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected += "<td rowspan=\"2\">2</td>\n";
        expected += "<td>22</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected += "<td>3</td>\n";
        expected += "<td>33</td>\n";
        expected += "</tr>\n";
        expected += "</tbody>\n";
        expected += "</table>\n";
        expected += "<table border=\"4\">\n";
        expected += "<thead>\n";
        expected += "<tr>\n";
        expected += "<th>A</th>\n";
        expected += "<th>B</th>\n";
        expected += "<th>C</th>\n";
        expected += "<th>D</th>\n";
        expected += "</tr>\n";
        expected += "</thead>\n";
        expected += "<tbody>\n";
        expected += "<tr>\n";
        expected += "<td colspan=\"2\">1</td>\n";
        expected += "<td colspan=\"3\">11</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected += "<td rowspan=\"2\">2</td>\n";
        expected += "<td colspan=\"2\">22</td>\n";
        expected += "<td>222</td>\n";
        expected += "</tr>\n";
        expected += "<tr>\n";
        expected += "<td>3</td>\n";
        expected += "<td colspan=\"2\">33</td>\n";
        expected += "</tr>\n";
        expected += "</tbody>\n";
        expected += "</table>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(replaceDelimiters("should support nested lists", options), async () => {
      const md = await createMarkdown();
      let src = "- item\n";
      src += "  - nested\n";
      src += "  {.red}\n";
      src += "\n";
      src += "{.blue}\n";
      let expected = "<ul class=\"blue\">\n";
      expected += "<li>item\n";
      expected += "<ul class=\"red\">\n";
      expected += "<li>nested</li>\n";
      expected += "</ul>\n";
      expected += "</li>\n";
      expected += "</ul>\n";
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it(replaceDelimiters("should support images", options), async () => {
      const md = await createMarkdown();
      const src = "![alt](img.png){.a}";
      const expected = "<p><img src=\"img.png\" alt=\"alt\" class=\"a\"></p>\n";
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it(
      replaceDelimiters("should work with plugin implicit-figures", options),
      async () => {
        const md = await createMarkdown();
        await md.use(implicitFigures, {}).isReady();
        const src = "![alt](img.png){.a}";
        const expected
          = "<figure><img src=\"img.png\" alt=\"alt\" class=\"a\"></figure>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should work with plugin katex", options),
      async () => {
        const md = await createMarkdown();
        md.use(math, {});
        const mdWithOnlyKatex = new MarkdownIt().use(math, {});
        await mdWithOnlyKatex.isReady();
        const src = "$\\sqrt{a}$";
        await expect(md.render(src)).resolves.toBe(
          await mdWithOnlyKatex.render(src),
        );
      },
    );

    it(
      replaceDelimiters("should not apply inside `code{.red}`", options),
      async () => {
        const md = await createMarkdown();
        const src = "paragraph `code{.red}`";
        const expected = "<p>paragraph <code>code{.red}</code></p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          replaceDelimiters(expected, options),
        );
      },
    );

    it(
      replaceDelimiters(
        "should not apply inside item lists with trailing `code{.red}`",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "- item with trailing `code = {.red}`";
        const expected
          = "<ul>\n<li>item with trailing <code>code = {.red}</code></li>\n</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          replaceDelimiters(expected, options),
        );
      },
    );

    it(
      replaceDelimiters(
        "should not apply inside item lists with trailing non-text, eg *{.red}*",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "- item with trailing *{.red}*";
        const expected
          = "<ul>\n<li>item with trailing <em>{.red}</em></li>\n</ul>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          replaceDelimiters(expected, options),
        );
      },
    );

    it(
      replaceDelimiters(
        "should work with multiple inline code blocks in same paragraph",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "bla `click()`{.c} blah `release()`{.cpp}";
        const expected
          = "<p>bla <code class=\"c\">click()</code> blah <code class=\"cpp\">release()</code></p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should support {} curlies with length == 3", options),
      async () => {
        const md = await createMarkdown();
        const src = "text {1}";
        const expected = "<p 1=\"\">text</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should do nothing with empty classname {.}", options),
      async () => {
        const md = await createMarkdown();
        const src = "text {.}";
        const expected = "<p>text {.}</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          replaceDelimiters(expected, options),
        );
      },
    );

    it(
      replaceDelimiters("should do nothing with empty id {#}", options),
      async () => {
        const md = await createMarkdown();
        const src = "text {#}";
        const expected = "<p>text {#}</p>\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          replaceDelimiters(expected, options),
        );
      },
    );

    it(
      replaceDelimiters("should support horizontal rules ---{#id}", options),
      async () => {
        const md = await createMarkdown();
        const src = "---{#id}";
        const expected = "<hr id=\"id\">\n";
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it("should restrict attributes by allowedAttributes (string)", async () => {
      const md = new MarkdownIt().use(
        attributes,
        Object.assign({ allowedAttributes: ["id", "class"] }, options),
      );
      await md.isReady();
      const src = "text {.someclass #someid attr=notAllowed}";
      const expected = "<p class=\"someclass\" id=\"someid\">text</p>\n";
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it("should restrict attributes by allowedAttributes (regex)", async () => {
      const md = new MarkdownIt().use(
        attributes,
        Object.assign({ allowedAttributes: [/^(class|attr)$/] }, options),
      );
      await md.isReady();
      const src = "text {.someclass #someid attr=allowed}";
      const expected = "<p class=\"someclass\" attr=\"allowed\">text</p>\n";
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it("should support multiple classes for <hr>", async () => {
      const md = await createMarkdown();
      const src = "--- {.a .b}";
      const expected = "<hr class=\"a b\">\n";
      await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
        expected,
      );
    });

    it(
      replaceDelimiters(
        "should not crash on {#ids} in front of list items",
        options,
      ),
      async () => {
        const md = await createMarkdown();
        const src = "- {#ids} [link](./link)";
        const expected = replaceDelimiters(
          "<ul>\n<li>{#ids} <a href=\"./link\">link</a></li>\n</ul>\n",
          options,
        );
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );

    it(
      replaceDelimiters("should support empty quoted attrs", options),
      async () => {
        const md = await createMarkdown();
        const src
          = "![](https://example.com/image.jpg){class=\"\" height=\"100\" width=\"\"}";
        const expected = replaceDelimiters(
          "<p><img src=\"https://example.com/image.jpg\" alt=\"\" class=\"\" height=\"100\" width=\"\"></p>\n",
          options,
        );
        await expect(md.render(replaceDelimiters(src, options))).resolves.toBe(
          expected,
        );
      },
    );
  });
}

function replaceDelimiters(text: string, options: describeTestsOptions) {
  return text
    .replace(/{/g, options.leftDelimiter)
    .replace(/}/g, options.rightDelimiter);
}
