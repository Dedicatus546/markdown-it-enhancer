// import attributes from "markdown-it-attrs";
import { MarkdownIt } from "markdown-it-enhancer";
import { describe, expect, it } from "vitest";

import { implicitFigures } from "../src";
import type { ImplicitFiguresOptions } from "../src/types";

describe("markdown-it-implicit-figures", () => {
  const createMarkdown = async (options: ImplicitFiguresOptions = {}) => {
    const md = new MarkdownIt();
    await md.use(implicitFigures, options).isReady();
    return md;
  };

  it("should add <figure> when image is by itself in a paragraph", async () => {
    const md = await createMarkdown();
    const src = "text with ![](img.png)\n\n![](fig.png)\n\nanother paragraph";
    const expected
      = "<p>text with <img src=\"img.png\" alt=\"\"></p>\n<figure><img src=\"fig.png\" alt=\"\"></figure>\n<p>another paragraph</p>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should add <figure> when image is by itself in a paragraph and preceded by a standalone link", async () => {
    const md = await createMarkdown({ dataType: true, figcaption: "title" });
    const src = "[![](fig.png \"Caption\")](http://example.com)";
    const expected
      = "<figure data-type=\"image\"><a href=\"http://example.com\"><img src=\"fig.png\" alt=\"\"></a><figcaption>Caption</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should add data-type=image to figures when opts.dataType is set", async () => {
    const md = await createMarkdown({ dataType: true });
    const src = "![](fig.png)\n";
    const expected
      = "<figure data-type=\"image\"><img src=\"fig.png\" alt=\"\"></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should convert title text into a figcaption when opts.figcaption is set to \"title\"", async () => {
    const md = await createMarkdown({ figcaption: "title" });
    const src = "![This is an alt](fig.png \"This is a caption\")";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"This is an alt\"><figcaption>This is a caption</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should convert alt text into a figcaption when opts.figcaption is set", async () => {
    const md = await createMarkdown({ figcaption: true });
    const src = "![This is an alt](fig.png \"This is a caption\")";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"\" title=\"This is a caption\"><figcaption>This is an alt</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should convert alt text into a figcaption when opts.figcaption is set and keep it when keepAlt is set", async () => {
    const md = await createMarkdown({ figcaption: true, keepAlt: true });
    const src = "![This is an alt](fig.png \"This is a caption\")";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"This is an alt\" title=\"This is a caption\"><figcaption>This is an alt</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should convert title text for each image into a figcaption when opts.figcaption is set to \"title\"", async () => {
    const md = await createMarkdown({ figcaption: "title" });
    const src
      = "![alt 1](fig.png \"caption 1\")\n\n![alt 2](fig2.png \"caption 2\")";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"alt 1\"><figcaption>caption 1</figcaption></figure>\n<figure><img src=\"fig2.png\" alt=\"alt 2\"><figcaption>caption 2</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should convert alt text for each image into a figcaption when opts.figcaption is set", async () => {
    const md = await createMarkdown({ figcaption: true });
    const src
      = "![alt 1](fig.png \"caption 1\")\n\n![alt 2](fig2.png \"caption 2\")";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"\" title=\"caption 1\"><figcaption>alt 1</figcaption></figure>\n<figure><img src=\"fig2.png\" alt=\"\" title=\"caption 2\"><figcaption>alt 2</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should convert alt text for each image into a figcaption when opts.figcaption is set and keepAlt is set", async () => {
    const md = await createMarkdown({ figcaption: true, keepAlt: true });
    const src
      = "![alt 1](fig.png \"caption 1\")\n\n![alt 2](fig2.png \"caption 2\")";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"alt 1\" title=\"caption 1\"><figcaption>alt 1</figcaption></figure>\n<figure><img src=\"fig2.png\" alt=\"alt 2\" title=\"caption 2\"><figcaption>alt 2</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should add incremental tabindex to figures when opts.tabindex is set", async () => {
    const md = await createMarkdown({ tabindex: true });
    const src = "![](fig.png)\n\n![](fig2.png)";
    const expected
      = "<figure tabindex=\"1\"><img src=\"fig.png\" alt=\"\"></figure>\n<figure tabindex=\"2\"><img src=\"fig2.png\" alt=\"\"></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should reset tabindex on each md.render()", async () => {
    const md = await createMarkdown({ tabindex: true });
    const src = "![](fig.png)\n\n![](fig2.png)";
    const expected
      = "<figure tabindex=\"1\"><img src=\"fig.png\" alt=\"\"></figure>\n<figure tabindex=\"2\"><img src=\"fig2.png\" alt=\"\"></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
    // render again, should produce same if resetting
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should add loading lazy attribute to image when opts.lazyLoading is set", async () => {
    const md = await createMarkdown({ lazyLoading: true });
    const src = "![](fig.png)";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"\" loading=\"lazy\"></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should not make figures of paragraphs with text and inline code", async () => {
    const md = await createMarkdown();
    const src = "Text.\n\nAnd `code`.";
    const expected = "<p>Text.</p>\n<p>And <code>code</code>.</p>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should not make figures of paragraphs with links only", async () => {
    const md = await createMarkdown();
    const src = "[link](page.html)";
    const expected = "<p><a href=\"page.html\">link</a></p>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should linkify captions when figcaption is set to \"title\"", async () => {
    const md = new MarkdownIt({ linkify: true });
    await md.use(implicitFigures, { figcaption: "title" }).isReady();
    const src = "![](fig.png \"www.google.com\")";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"\"><figcaption><a href=\"http://www.google.com\">www.google.com</a></figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should linkify captions when figcaption is on", async () => {
    const md = new MarkdownIt({ linkify: true });
    await md.use(implicitFigures, { figcaption: true }).isReady();
    const src = "![www.google.com](fig.png)";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"\"><figcaption><a href=\"http://www.google.com\">www.google.com</a></figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should linkify captions when figcaption is on and keepAlt is set", async () => {
    const md = new MarkdownIt({ linkify: true });
    await md
      .use(implicitFigures, {
        figcaption: true,
        keepAlt: true,
      })
      .isReady();
    const src = "![www.google.com](fig.png)";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"www.google.com\"><figcaption><a href=\"http://www.google.com\">www.google.com</a></figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  // TODO
  // it("should work with markdown-it-attrs", async () => {
  //   md = Md().use(attrs).use(implicitFigures);
  //   const src = "![](fig.png){.asdf}";
  //   const expected =
  //     '<figure><img src="fig.png" alt="" class="asdf"></figure>\n';
  //   const res = md.render(src);
  //   await expect(res, expected);
  // });

  it("should put the image inside a link to the image if it is not yet linked", async () => {
    const md = await createMarkdown({ link: true });
    const src = "![www.google.com](fig.png)";
    const expected
      = "<figure><a href=\"fig.png\"><img src=\"fig.png\" alt=\"www.google.com\"></a></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should not mess up figcaption when linking and figcaption is set to \"title\"", async () => {
    const md = await createMarkdown({ figcaption: "title", link: true });
    const src = "![](fig.png \"www.google.com\")";
    const expected
      = "<figure><a href=\"fig.png\"><img src=\"fig.png\" alt=\"\"></a><figcaption>www.google.com</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should not mess up figcaption when linking", async () => {
    const md = await createMarkdown({ figcaption: "alt", link: true });
    const src = "![www.google.com](fig.png)";
    const expected
      = "<figure><a href=\"fig.png\"><img src=\"fig.png\" alt=\"\"></a><figcaption>www.google.com</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should not mess up figcaption when linking and keepAlt is set", async () => {
    const md = await createMarkdown({
      figcaption: "alt",
      link: true,
      keepAlt: true,
    });
    const src = "![www.google.com](fig.png)";
    const expected
      = "<figure><a href=\"fig.png\"><img src=\"fig.png\" alt=\"www.google.com\"></a><figcaption>www.google.com</figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should leave the image inside a link (and not create an extra one) if it is already linked", async () => {
    const md = await createMarkdown({ link: true });
    const src = "[![www.google.com](fig.png)](link.html)";
    const expected
      = "<figure><a href=\"link.html\"><img src=\"fig.png\" alt=\"www.google.com\"></a></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  it("should keep structured markup inside caption (even if not supported in \"alt\" attribute)", async () => {
    const md = await createMarkdown({ figcaption: "title" });
    const src = "![](fig.png \"Image from [source](to)\")";
    const expected
      = "<figure><img src=\"fig.png\" alt=\"\"><figcaption>Image from <a href=\"to\">source</a></figcaption></figure>\n";
    await expect(md.render(src)).resolves.toBe(expected);
  });

  // TODO
  // it("should copy attributes from img to figure tag", async () => {
  //   const md = await createMarkdown({ copyAttrs: "^class$" });
  //   md = Md().use(attrs).use(implicitFigures);
  //   const src = "![caption](fig.png){.cls attr=val}";
  //   const expected =
  //     '<figure class="cls"><img src="fig.png" alt="caption" class="cls" attr="val"></figure>\n';
  //   const res = md.render(src);
  //   await expect(res, expected);
  // });
});
