import fs from "node:fs";

import { anchor } from "markdown-it-anchor-for-enhancer";
import { attributes } from "markdown-it-attrs-for-enhancer";
import { MarkdownIt } from "markdown-it-enhancer";
import { describe, expect, it } from "vitest";

import { tableOfContents } from "../src";

const markdownItAnchorOpts = { tabIndex: false as const, uniqueSlugStartIndex: 2 };

// Defaults
const defaultContainerClass = "table-of-contents";
const defaultMarker = "[[toc]]";
const defaultListType = "ul";

// Fixtures
const simpleMarkdown = fs.readFileSync("test/fixtures/simple.md", "utf-8");
const simpleWithFormatting = fs.readFileSync("test/fixtures/simple-with-markdown-formatting.md", "utf-8");
const simpleWithFormattingHTML = fs.readFileSync("test/fixtures/simple-with-markdown-formatting.html", "utf-8");
const simpleDefaultHTML = fs.readFileSync("test/fixtures/simple-default.html", "utf-8");
const simple1LevelHTML = fs.readFileSync("test/fixtures/simple-1-level.html", "utf-8");
const simpleWithAnchorsHTML = fs.readFileSync("test/fixtures/simple-with-anchors.html", "utf-8");
const simpleWithHeaderFooterHTML = fs.readFileSync("test/fixtures/simple-with-header-footer.html", "utf-8");
const simpleWithTransformLink = fs.readFileSync("test/fixtures/simple-with-transform-link.html", "utf-8");
const simpleWithHeadingLink = fs.readFileSync("test/fixtures/simple-with-heading-links.md", "utf-8");
const simpleWithHeadingLinkHTML = fs.readFileSync("test/fixtures/simple-with-heading-links.html", "utf-8");
const simpleWithDuplicateHeadings = fs.readFileSync("test/fixtures/simple-with-duplicate-headings.md", "utf-8");
const simpleWithDuplicateHeadingsHTML = fs.readFileSync("test/fixtures/simple-with-duplicate-headings.html", "utf-8");
const emptyMarkdown = defaultMarker;
const emptyMarkdownHtml = fs.readFileSync("test/fixtures/empty.html", "utf-8");

const multiLevelMarkdown = fs.readFileSync("test/fixtures/multi-level.md", "utf-8");
const multiLevel1234HTML = fs.readFileSync("test/fixtures/multi-level-1234.html", "utf-8");
const multiLevel23HTML = fs.readFileSync("test/fixtures/multi-level-23.html", "utf-8");
const strangeOrderMarkdown = fs.readFileSync("test/fixtures/strange-order.md", "utf-8");
const strangeOrderHTML = fs.readFileSync("test/fixtures/strange-order.html", "utf-8");

const customAttrsMarkdown = fs.readFileSync("test/fixtures/custom-attrs.md", "utf-8");
const customAttrsHTML = fs.readFileSync("test/fixtures/custom-attrs.html", "utf-8");
const customAttrsWithAnchorsHTML = fs.readFileSync("test/fixtures/custom-attrs-with-anchors.html", "utf-8");

const fullExampleMarkdown = fs.readFileSync("test/fixtures/full-example.md", "utf-8");
const fullExampleHTML = fs.readFileSync("test/fixtures/full-example.html", "utf-8");
const fullExampleCustomContainerHTML = fs.readFileSync("test/fixtures/full-example-custom-container.html", "utf-8");

const basicMarkdown = fs.readFileSync("test/fixtures/basic.md", "utf-8");
const basicHTML = fs.readFileSync("test/fixtures/basic.html", "utf-8");

const anchorsSpecialCharsMarkdown = fs.readFileSync("test/fixtures/anchors-special-chars.md", "utf-8");
const anchorsSpecialCharsHTML = fs.readFileSync("test/fixtures/anchors-special-chars.html", "utf-8");

const omitMarkdown = fs.readFileSync("test/fixtures/omit.md", "utf-8");
const omitHTML = fs.readFileSync("test/fixtures/omit.html", "utf-8");

const headingWithFormattingHTML = fs.readFileSync("test/fixtures/heading-with-formatting.html", "utf-8");

const slugify = (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, "-"));

describe("Testing Markdown rendering", () => {
  it("Parses correctly with default settings", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents);
    await md.isReady();
    expect(await md.render(simpleMarkdown)).toBe(simpleDefaultHTML);
  });

  it("Parses correctly with includeLevel set", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [2],
    });
    await md.isReady();
    expect(await md.render(simpleMarkdown)).toBe(simple1LevelHTML);
  });

  it("Parses correctly with containerClass set", async () => {
    const md = new MarkdownIt();
    const customContainerClass = "custom-container-class";
    md.use(tableOfContents, {
      containerClass: customContainerClass,
    });
    await md.isReady();
    expect(await md.render(simpleMarkdown)).toBe(simpleDefaultHTML.replace(defaultContainerClass, customContainerClass));
  });

  it("Parses correctly with markerPattern set", async () => {
    const md = new MarkdownIt();
    const customMarker = "[[custom-marker]]";
    md.use(tableOfContents, {
      markerPattern: /^\[\[custom-marker\]\]/im,
    });
    await md.isReady();
    expect(await md.render(simpleMarkdown.replace(defaultMarker, customMarker))).toBe(simpleDefaultHTML);
  });

  it("Parses correctly with listType set", async () => {
    const md = new MarkdownIt();
    const customListType = "ol";
    md.use(tableOfContents, {
      listType: customListType,
    });
    await md.isReady();
    expect(await md.render(simpleMarkdown)).toBe(simpleDefaultHTML.replace(new RegExp(defaultListType, "g"), customListType));
  });

  it("Formats markdown by default", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents);
    await md.isReady();
    expect(await md.render(simpleWithFormatting)).toBe(simpleWithFormattingHTML);
  });

  it("Parses correctly with custom formatting", async () => {
    const md = new MarkdownIt();
    const customHeading = "Heading with custom formatting 123abc";
    md.use(tableOfContents, {
      format() {
        return Promise.resolve(customHeading);
      },
    });
    await md.isReady();
    expect((await md.render(simpleMarkdown)).includes(customHeading)).toBe(true);
  });

  it("Custom formatting includes markdown and link", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      format(str, md, link) {
        expect(Object.prototype.isPrototypeOf.call(MarkdownIt.prototype, md)).toBe(true);
        expect(link).not.toBe(null);
        return Promise.resolve("customHeading");
      },
    });
    await md.isReady();
    expect((await md.render(simpleMarkdown)).includes("customHeading")).toBe(true);
  });

  it("Slugs match markdown-it-anchor", async () => {
    const md = new MarkdownIt();
    md.use(anchor, markdownItAnchorOpts);
    md.use(tableOfContents);
    await md.isReady();
    expect(await md.render(simpleMarkdown)).toBe(simpleWithAnchorsHTML);
  });

  it("Slugs match markdown-it-anchor with special chars", async () => {
    const md = new MarkdownIt();
    md.use(anchor, markdownItAnchorOpts);
    md.use(tableOfContents);
    await md.isReady();
    expect(await md.render(anchorsSpecialCharsMarkdown)).toBe(anchorsSpecialCharsHTML);
  });

  it("Generates empty TOC", async () => {
    const md = new MarkdownIt();
    md.use(anchor, markdownItAnchorOpts);
    md.use(tableOfContents);
    await md.isReady();
    expect(await md.render(emptyMarkdown)).toBe(emptyMarkdownHtml);
  });

  it("Parses correctly with container header and footer html set", async () => {
    const md = new MarkdownIt();
    md.use(anchor, markdownItAnchorOpts);
    md.use(tableOfContents, {
      slugify,
      containerHeaderHtml: "<div class=\"header\">Contents</div>",
      containerFooterHtml: "<div class=\"footer\">Footer</div>",
    });
    await md.isReady();
    expect(await md.render(simpleMarkdown)).toBe(simpleWithHeaderFooterHTML);
  });

  it("Generates TOC, with custom transformed link", async () => {
    const md = new MarkdownIt();
    md.use(anchor, markdownItAnchorOpts);
    md.use(tableOfContents, {
      slugify,
      transformLink(href) {
        return href + "&type=test";
      },
    });
    await md.isReady();
    expect(await md.render(simpleMarkdown)).toBe(simpleWithTransformLink);
  });

  it("Parses correctly when headers are links", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents);
    md.use(anchor, markdownItAnchorOpts);
    await md.isReady();
    expect(await md.render(simpleWithHeadingLink)).toBe(simpleWithHeadingLinkHTML);
  });

  it("Parses correctly with duplicate headers", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [1, 2, 3, 4],
    });
    md.use(anchor, markdownItAnchorOpts);
    await md.isReady();
    expect(await md.render(simpleWithDuplicateHeadings)).toBe(simpleWithDuplicateHeadingsHTML);
  });

  it("Parses correctly with multiple levels", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [1, 2, 3, 4],
    });
    await md.isReady();
    expect(await md.render(multiLevelMarkdown)).toBe(multiLevel1234HTML);
  });

  it("Parses correctly with subset of multiple levels", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [2, 3],
    });
    await md.isReady();
    expect(await md.render(multiLevelMarkdown)).toBe(multiLevel23HTML);
  });

  it("Can manage headlines in a strange order", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [1, 2, 3],
    });
    await md.isReady();
    expect(await md.render(strangeOrderMarkdown)).toBe(strangeOrderHTML);
  });

  it("Parses correctly with custom heading id attrs", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [1, 2, 3, 4],
    });
    md.use(attributes);
    await md.isReady();
    expect(await md.render(customAttrsMarkdown)).toBe(customAttrsHTML);
  });

  it("Parses correctly when combining markdown-it-attrs and markdown-it-anchor", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [1, 2, 3, 4],
    });
    md.use(attributes);
    await md.isReady();
    expect(await md.render(customAttrsMarkdown)).toBe(customAttrsWithAnchorsHTML);
  });

  it("Full example", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [2, 3, 4],
    });
    md.use(attributes);
    md.use(anchor, markdownItAnchorOpts);
    await md.isReady();
    expect(await md.render(fullExampleMarkdown)).toBe(fullExampleHTML);
  });

  it("Full example with a custom container", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [2, 3, 4],
      transformContainerOpen() {
        return "<nav class=\"my-toc\"><button>Toggle</button><h3>Table of Contents</h3>";
      },
      transformContainerClose() {
        return "</nav>";
      },
    });
    md.use(attributes);
    md.use(anchor, markdownItAnchorOpts);
    await md.isReady();
    expect(await md.render(fullExampleMarkdown)).toBe(fullExampleCustomContainerHTML);
  });

  it("Lets you emulate the old behavior", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      includeLevel: [2, 3, 4],
      transformContainerOpen() {
        return "<nav class=\"my-toc\"><button>Toggle</button><h3>Table of Contents</h3>";
      },
      transformContainerClose() {
        return "</nav>";
      },
    });
    md.use(attributes);
    md.use(anchor, markdownItAnchorOpts);
    await md.isReady();
    expect(await md.render(fullExampleMarkdown)).toBe(fullExampleCustomContainerHTML);
  });

  it("lets you emulate old behavior", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      transformContainerOpen() {
        return "<p><div class=\"table-of-contents\">";
      },
      transformContainerClose() {
        return "</div></p>";
      },
    });
    await md.isReady();
    expect(await md.render(basicMarkdown)).toBe(basicHTML);
  });

  it("getTokensText", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      getTokensText: tokens => tokens.filter(t => ["text", "image"].includes(t.type)).map(t => t.content).join(""),
    });
    await md.isReady();
    expect(await md.render("# H1 ![image](link) `code` _em_" + "\n" + "[[toc]]")).toBe(
      "<h1>H1 <img src=\"link\" alt=\"image\"> <code>code</code> <em>em</em></h1>\n"
      + "<div class=\"table-of-contents\"><ul><li><a href=\"#h1-image-em\">H1 image  em</a></li></ul></div>\n",
    );
  });

  it("Omits headlines", async () => {
    const md = new MarkdownIt({ html: true });
    md.use(tableOfContents, { omitTag: "<!-- omit from toc -->" });
    await md.isReady();
    expect(await md.render(omitMarkdown)).toBe(omitHTML);
  });

  it("Whitespace is maintained in custom format param", async () => {
    const md = new MarkdownIt();
    md.use(attributes);
    md.use(anchor);
    md.use(tableOfContents, {
      format(str, md) {
        const hasSpaces = /\s{5,}/.test(str);
        expect(hasSpaces).toBe(true);
        return md.renderInline(str);
      },
    });
    await md.isReady();
    await md.render("# Heading with     5 spaces\n\n[[toc]]");
  });

  it("No whitespace at end of headline when using custom attributes, fixes #67 part 2", async () => {
    const md = new MarkdownIt();
    md.use(attributes);
    md.use(anchor);
    md.use(tableOfContents, {
      format: (str, md) => {
        const hasSpaces = /\s{1,}$/.test(str);
        expect(hasSpaces).toBe(false);
        return md.renderInline(str);
      },
    });
    await md.isReady();
    await md.render("# Heading with spaces at end  \n\n[[toc]]");
    await md.render("# Another heading with custom attrs and tabs\t{#custom-id}\n[[toc]]");
    await md.render("# A third heading with custom attrs and spaces    {#custom-id}\n[[toc]]");
  });

  it("Keep formatting in headlines, fixes #67 part 1", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents, {
      getTokensText: (tokens, rawToken) => {
        expect(rawToken.content, "Heading with *emphasis* and **bold** and `code` and ![img](test.png)");
        return rawToken.content;
      },
      slugify: (text, rawToken) => {
        expect(text, "Heading with *emphasis* and **bold** and `code` and ![img](test.png)");
        const s = rawToken.children.map(t => t.content).join("").trim();
        return encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, "-"));
      },
      format: (str, md) => {
        expect(str, "Heading with *emphasis* and **bold** and `code` and ![img](test.png)");
        return md.renderInline(str);
      },
    });
    await md.isReady();
    const result = await md.render("# Heading with *emphasis* and **bold** and `code` and ![img](test.png)\n[[toc]]");
    expect(result).toBe(headingWithFormattingHTML);
  });

  it("Default: drop formatting in headlines", async () => {
    const md = new MarkdownIt();
    md.use(tableOfContents);
    await md.isReady();
    const result = await md.render("# Heading with *emphasis* and **bold** and `code` and ![img](test.png)\n[[toc]]");
    const html = `<h1>Heading with <em>emphasis</em> and <strong>bold</strong> and <code>code</code> and <img src="test.png" alt="img"></h1>
<div class="table-of-contents"><ul><li><a href="#heading-with-emphasis-and-bold-and-code-and">Heading with emphasis and bold and code and</a></li></ul></div>\n`;
    expect(result).toBe(html);
  });
});
