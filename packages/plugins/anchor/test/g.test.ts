import { attributes } from "markdown-it-attrs-for-enhancer";
import { MarkdownIt, Token } from "markdown-it-enhancer";
import { describe, expect, it } from "vitest";

import {
  anchor,
  ariaHidden,
  headerLink,
  linkAfterHeader,
  linkInsideHeader,
} from "../src";
import { AnchorInfo } from "../src/types";

it("default", async () => {
  const md = new MarkdownIt();
  await md.use(anchor, {}).isReady();
  await expect(md.render("# H1\n\n## H2")).resolves.toBe(
    '<h1 id="h1" tabindex="-1">H1</h1>\n<h2 id="h2" tabindex="-1">H2</h2>\n',
  );
});

describe("makrdown-it-attrs", () => {
  it("default", async () => {
    const md = new MarkdownIt();
    await md.use(attributes).use(anchor, {}).isReady();

    await expect(
      md.render("# H1 {id=bubblegum}\n\n## H2 {id=shoelaces}"),
    ).resolves.toBe(
      '<h1 id="bubblegum" tabindex="-1">H1</h1>\n<h2 id="shoelaces" tabindex="-1">H2</h2>\n',
    );
  });

  it("partial auto", async () => {
    const md = new MarkdownIt();
    await md.use(attributes, {}).use(anchor, {}).isReady();
    await expect(md.render("# H1 {id=h2}\n\n## H2")).resolves.toBe(
      '<h1 id="h2" tabindex="-1">H1</h1>\n<h2 id="h2-1" tabindex="-1">H2</h2>\n',
    );
  });

  it("id conflict user", async () => {
    const md = new MarkdownIt();
    await md.use(attributes, {}).use(anchor, {}).isReady();
    await expect(
      md.render("# H1 {id=bubblegum}\n\n## H2 {id=bubblegum}"),
    ).rejects.toThrowError(
      new Error(
        "User defined `id` attribute `bubblegum` is not unique. Please fix it in your Markdown to continue.",
      ),
    );
    // expect(
    //   (() => {
    //     try {
    //       return await;
    //     } catch (ex) {
    //       return ex.message;
    //     }
    //   })(),
    //   "",
    // );
  });

  it("id conflict auto", async () => {
    const md = new MarkdownIt();
    await md.use(attributes, {}).use(anchor, {}).isReady();
    await expect(md.render("# H1\n\n## H2 {id=h1}")).rejects.toThrowError(
      new Error(
        "User defined `id` attribute `h1` is not unique. Please fix it in your Markdown to continue.",
      ),
    );
    // expect(
    //   (() => {
    //     try {
    //       return md().use(attrs).use(anchor).render("# H1\n\n## H2 {id=h1}");
    //     } catch (ex) {
    //       return ex.message;
    //     }
    //   })(),
    //   "User defined `id` attribute `h1` is not unique. Please fix it in your Markdown to continue.",
    // );
  });
});

it("level number", async () => {
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      level: 2,
    })
    .isReady();
  await expect(md.render("# H1\n\n## H2")).resolves.toBe(
    '<h1>H1</h1>\n<h2 id="h2" tabindex="-1">H2</h2>\n',
  );
});

it("level array", async () => {
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      level: [2, 4],
    })
    .isReady();
  await expect(
    md.render("# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5"),
  ).resolves.toBe(
    '<h1>H1</h1>\n<h2 id="h2" tabindex="-1">H2</h2>\n<h3>H3</h3>\n<h4 id="h4" tabindex="-1">H4</h4>\n<h5>H5</h5>\n',
  );
});

// describe("legacy permalink", async () => {
//   it("default", async () => {
//     const md = new MarkdownIt();
//     await md
//       .use(anchor, {
//         permalink: true,
//       })
//       .isReady();
//     await expect(md.render("# H1")).resolves.toBe(
//       '<h1 id="h1" tabindex="-1">H1 <a class="header-anchor" href="#h1">¶</a></h1>\n',
//     );
//   });

//   it("class", (t) => {
//     expect(
//       md()
//         .use(anchor, { permalink: true, permalinkClass: "test" })
//         .render("# H1"),
//       '<h1 id="h1" tabindex="-1">H1 <a class="test" href="#h1">¶</a></h1>\n',
//     );
//   });

//   it("class null", (t) => {
//     expect(
//       md()
//         .use(anchor, { permalink: true, permalinkClass: null })
//         .render("# H1"),
//       '<h1 id="h1" tabindex="-1">H1 <a href="#h1">¶</a></h1>\n',
//     );
//   });

//   it("symbol", (t) => {
//     expect(
//       md()
//         .use(anchor, { permalink: true, permalinkSymbol: "P" })
//         .render("# H1"),
//       '<h1 id="h1" tabindex="-1">H1 <a class="header-anchor" href="#h1">P</a></h1>\n',
//     );
//   });

//   it("symbol html", (t) => {
//     expect(
//       md()
//         .use(anchor, {
//           permalink: true,
//           permalinkSymbol: '<i class="icon"></i>',
//         })
//         .render("# H1"),
//       '<h1 id="h1" tabindex="-1">H1 <a class="header-anchor" href="#h1"><i class="icon"></i></a></h1>\n',
//     );
//   });

//   it("before", (t) => {
//     expect(
//       md()
//         .use(anchor, { permalink: true, permalinkBefore: true })
//         .render("# H1"),
//       '<h1 id="h1" tabindex="-1"><a class="header-anchor" href="#h1">¶</a> H1</h1>\n',
//     );
//   });

//   it("level", (t) => {
//     expect(
//       md().use(anchor, { level: 2, permalink: true }).render("# H1\n\n## H2"),
//       '<h1>H1</h1>\n<h2 id="h2" tabindex="-1">H2 <a class="header-anchor" href="#h2">¶</a></h2>\n',
//     );
//   });

//   it("html", (t) => {
//     expect(
//       md({ html: true })
//         .use(anchor, { permalink: true })
//         .render("# <span>H1</span>"),
//       '<h1 id="h1" tabindex="-1"><span>H1</span> <a class="header-anchor" href="#h1">¶</a></h1>\n',
//     );
//   });

//   it("href", (t) => {
//     expect(
//       md()
//         .use(anchor, {
//           permalinkHref: (slug, state) => `${state.env.path}#${slug}`,
//           permalink: true,
//         })
//         .render("# H1", { path: "file.html" }),
//       '<h1 id="h1" tabindex="-1">H1 <a class="header-anchor" href="file.html#h1">¶</a></h1>\n',
//     );
//   });

//   it("space", (t) => {
//     expect(
//       md({ html: true })
//         .use(anchor, { permalink: true, permalinkSpace: false })
//         .render("# H1"),
//       '<h1 id="h1" tabindex="-1">H1<a class="header-anchor" href="#h1">¶</a></h1>\n',
//     );
//   });

//   it("no space", (t) => {
//     expect(
//       md({ html: true })
//         .use(anchor, { permalink: false, permalinkSpace: false })
//         .render("# H1"),
//       '<h1 id="h1" tabindex="-1">H1</h1>\n',
//     );
//   });

//   it("attrs", (t) => {
//     expect(
//       md()
//         .use(anchor, {
//           permalink: true,
//           permalinkAttrs: (slug, state) => ({
//             "aria-label": `permalink to ${slug}`,
//             title: "permalink",
//           }),
//         })
//         .render("# My title"),
//       '<h1 id="my-title" tabindex="-1">My title <a class="header-anchor" href="#my-title" aria-label="permalink to my-title" title="permalink">¶</a></h1>\n',
//     );
//   });
// });

it("tabindex", async () => {
  const md = new MarkdownIt();
  await md.use(anchor, {}).isReady();
  await expect(md.render("# Title\n\n## Title")).resolves.toBe(
    '<h1 id="title" tabindex="-1">Title</h1>\n<h2 id="title-1" tabindex="-1">Title</h2>\n',
  );
});

it("code", async () => {
  const md = new MarkdownIt();
  await md.use(anchor, {}).isReady();
  await expect(md.render("#### `options`")).resolves.toBe(
    '<h4 id="options" tabindex="-1"><code>options</code></h4>\n',
  );
});

it("callback", async () => {
  const calls: Array<{
    token: Token;
    info: AnchorInfo;
  }> = [];
  const callback = (token: Token, info: AnchorInfo) =>
    calls.push({ token, info });
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      callback,
    })
    .isReady();

  await expect(md.render("# First Heading\n\n## Second Heading")).resolves.toBe(
    '<h1 id="first-heading" tabindex="-1">First Heading</h1>\n<h2 id="second-heading" tabindex="-1">Second Heading</h2>\n',
  );

  expect(calls.length).toBe(2);
  expect(calls[0].token.tag).toBe("h1");
  expect(calls[0].info.title).toBe("First Heading");
  expect(calls[0].info.slug).toBe("first-heading");
  expect(calls[1].token.tag).toBe("h2");
  expect(calls[1].info.title).toBe("Second Heading");
  expect(calls[1].info.slug).toBe("second-heading");
});

it("tabIndex false", async () => {
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      tabIndex: false,
    })
    .isReady();
  await expect(md.render("# H1\n\n## H2")).resolves.toBe(
    '<h1 id="h1">H1</h1>\n<h2 id="h2">H2</h2>\n',
  );
});

it("tabIndex 0", async () => {
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      tabIndex: 0,
    })
    .isReady();
  await expect(md.render("# H1\n\n## H2")).resolves.toBe(
    '<h1 id="h1" tabindex="0">H1</h1>\n<h2 id="h2" tabindex="0">H2</h2>\n',
  );
});

it("uniqueSlugStartIndex", async () => {
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      uniqueSlugStartIndex: 2,
    })
    .isReady();
  await expect(md.render("# Lorem\n## Lorem\n### Lorem")).resolves.toBe(
    '<h1 id="lorem" tabindex="-1">Lorem</h1>\n<h2 id="lorem-2" tabindex="-1">Lorem</h2>\n<h3 id="lorem-3" tabindex="-1">Lorem</h3>\n',
  );
});

it("nested things", async () => {
  const md = new MarkdownIt({ html: true });
  await md.use(anchor, {}).isReady();
  await expect(
    md.render(
      "# H1 [link](link) ![image](link) `code` ~~strike~~ _em_ **strong** <span>inline html</span>",
    ),
  ).resolves.toBe(
    '<h1 id="h1-link-code-strike-em-strong-inline-html" tabindex="-1">H1 <a href="link">link</a> <img src="link" alt="image"> <code>code</code> <s>strike</s> <em>em</em> <strong>strong</strong> <span>inline html</span></h1>\n',
  );
});

it("getTokensText", async () => {
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      getTokensText: (tokens) =>
        tokens
          .filter((t) => ["text", "image"].includes(t.type))
          .map((t) => t.content)
          .join(""),
    })
    .isReady();
  await expect(md.render("# H1 ![image](link) `code` _em_")).resolves.toBe(
    '<h1 id="h1-image-em" tabindex="-1">H1 <img src="link" alt="image"> <code>code</code> <em>em</em></h1>\n',
  );
});

it("slugify", async () => {
  const slugify = (await import("@sindresorhus/slugify")).default;
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      slugify,
    })
    .isReady();

  await expect(md.render("# foo bar")).resolves.toBe(
    '<h1 id="foo-bar" tabindex="-1">foo bar</h1>\n',
  );
});

it("slugify with state", async () => {
  const md = new MarkdownIt();
  await md
    .use(anchor, {
      slugifyWithState: (title, state) => `${state.env.docId}-${title}`,
    })
    .isReady();
  await expect(md.render("# bar", { docId: "foo" })).resolves.toBe(
    '<h1 id="foo-bar" tabindex="-1">bar</h1>\n',
  );
});

describe("permalink.linkInsideHeader", () => {
  it("default", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkInsideHeader({}),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1 <a class="header-anchor" href="#h1">#</a></h1>\n',
    );
  });

  it("no space", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkInsideHeader({ space: false }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1<a class="header-anchor" href="#h1">#</a></h1>\n',
    );
  });

  it("custom space", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkInsideHeader({ space: "&nbsp;" }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1&nbsp;<a class="header-anchor" href="#h1">#</a></h1>\n',
    );
  });

  it("html", async () => {
    const symbol =
      '<span class="visually-hidden">Jump to heading</span> <span aria-hidden="true">#</span>';
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkInsideHeader({ symbol, placement: "before" }),
      })
      .isReady();

    await expect(md.render("# H1")).resolves.toBe(
      `<h1 id="h1" tabindex="-1"><a class="header-anchor" href="#h1">${symbol}</a> H1</h1>\n`,
    );
  });

  it("renderAttrs", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkInsideHeader({
          renderAttrs: () => ({
            class: "should-merge-class",
            id: "some-id",
          }),
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1 <a class="header-anchor should-merge-class" href="#h1" id="some-id">#</a></h1>\n',
    );
  });
});

describe("permalink.ariaHidden", () => {
  it("default", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: ariaHidden({}),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1 <a class="header-anchor" href="#h1" aria-hidden="true">#</a></h1>\n',
    );
  });

  it("html", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: ariaHidden({
          symbol: '<i class="icon"></i>',
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1 <a class="header-anchor" href="#h1" aria-hidden="true"><i class="icon"></i></a></h1>\n',
    );
  });
});

describe("permalink.headerLink", () => {
  it("default", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: headerLink({}),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1"><a class="header-anchor" href="#h1">H1</a></h1>\n',
    );
  });

  it("Safari reader fix", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: headerLink({
          safariReaderFix: true,
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1"><a class="header-anchor" href="#h1"><span>H1</span></a></h1>\n',
    );
  });
});

describe("permalink.linkAfterHeader", () => {
  it("default", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkAfterHeader({
          symbol: '<i class="icon"></i>',
          style: "visually-hidden",
          assistiveText: (title) => `Permalink to “${title}”`,
          visuallyHiddenClass: "visually-hidden",
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1</h1>\n<a class="header-anchor" href="#h1"><span class="visually-hidden">Permalink to “H1”</span> <span aria-hidden="true"><i class="icon"></i></span></a>',
    );
  });

  it("no symbol", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkAfterHeader({
          style: "visually-hidden",
          assistiveText: (title) => `Permalink to “${title}”`,
          visuallyHiddenClass: "visually-hidden",
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1</h1>\n<a class="header-anchor" href="#h1"><span class="visually-hidden">Permalink to “H1”</span> <span aria-hidden="true">#</span></a>',
    );
  });

  it("multiple headers", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkAfterHeader({
          style: "visually-hidden",
          assistiveText: (title) => `Permalink to “${title}”`,
          visuallyHiddenClass: "visually-hidden",
        }),
      })
      .isReady();
    await expect(
      md.render("# H1\n\n## H2\n\n### H3\n\n#### H4\n\n## H2-2"),
    ).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1</h1>\n<a class="header-anchor" href="#h1"><span class="visually-hidden">Permalink to “H1”</span> ' +
        '<span aria-hidden="true">#</span></a><h2 id="h2" tabindex="-1">H2</h2>\n<a class="header-anchor" href="#h2"><span class="visually-hidden">Permalink to “H2”</span> ' +
        '<span aria-hidden="true">#</span></a><h3 id="h3" tabindex="-1">H3</h3>\n<a class="header-anchor" href="#h3"><span class="visually-hidden">Permalink to “H3”</span> ' +
        '<span aria-hidden="true">#</span></a><h4 id="h4" tabindex="-1">H4</h4>\n<a class="header-anchor" href="#h4"><span class="visually-hidden">Permalink to “H4”</span> ' +
        '<span aria-hidden="true">#</span></a><h2 id="h2-2" tabindex="-1">H2-2</h2>\n<a class="header-anchor" href="#h2-2"><span class="visually-hidden">Permalink to “H2-2”</span> <span aria-hidden="true">#</span></a>',
    );
  });

  it("aria-label", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkAfterHeader({
          style: "aria-label",
          assistiveText: (title) => `Permalink to “${title}”`,
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1</h1>\n<a class="header-anchor" href="#h1" aria-label="Permalink to “H1”">#</a>',
    );
  });

  it("aria-describedby", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkAfterHeader({
          style: "aria-describedby",
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1</h1>\n<a class="header-anchor" href="#h1" aria-describedby="h1">#</a>',
    );
  });

  it("placement", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkAfterHeader({
          style: "visually-hidden",
          assistiveText: (title) => `Permalink to “${title}”`,
          visuallyHiddenClass: "visually-hidden",
          placement: "before",
          space: false,
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<h1 id="h1" tabindex="-1">H1</h1>\n<a class="header-anchor" href="#h1"><span aria-hidden="true">#</span><span class="visually-hidden">Permalink to “H1”</span></a>',
    );
  });

  it("custom splice wrapper", async () => {
    const l = linkAfterHeader({
      style: "visually-hidden",
      assistiveText: (title) => `Permalink to “${title}”`,
      visuallyHiddenClass: "visually-hidden",
    });
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink(slug, opts, state, idx) {
          state.tokens.splice(
            idx,
            0,
            Object.assign(new state.Token("div_open", "div", 1), {
              attrs: [["class", "wrapper"]],
              block: true,
            }),
          );

          state.tokens.splice(
            idx + 4,
            0,
            Object.assign(new state.Token("div_close", "div", -1), {
              block: true,
            }),
          );

          l(slug, opts, state, idx + 1);
        },
      })
      .isReady();

    await expect(md.render("# H1")).resolves.toBe(
      '<div class="wrapper">\n<h1 id="h1" tabindex="-1">H1</h1>\n<a class="header-anchor" href="#h1"><span class="visually-hidden">Permalink to “H1”</span> <span aria-hidden="true">#</span></a></div>\n',
    );
  });

  it("custom native wrapper", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: linkAfterHeader({
          style: "visually-hidden",
          assistiveText: (title) => `Permalink to “${title}”`,
          visuallyHiddenClass: "visually-hidden",
          wrapper: ['<div class="wrapper">', "</div>"],
        }),
      })
      .isReady();
    await expect(md.render("# H1")).resolves.toBe(
      '<div class="wrapper">\n<h1 id="h1" tabindex="-1">H1</h1>\n<a class="header-anchor" href="#h1"><span class="visually-hidden">Permalink to “H1”</span> <span aria-hidden="true">#</span></a></div>\n',
    );
  });
});

describe("tokens", () => {
  const dumpTokens = (cb: (tokens: Array<Token>) => void) => {
    return (md: MarkdownIt) => {
      md.core.ruler.push("test", (state) => {
        cb(state.tokens);
      });
    };
  };

  it("new permalink html_inline", async () => {
    const md = new MarkdownIt();
    await md
      .use(anchor, {
        permalink: ariaHidden({}),
      })
      .use(
        dumpTokens((tokens) => {
          expect(tokens[1].children[3].type, "html_inline");
          expect(tokens[1].children[3].content, "#");
          expect(tokens[1].children[3].meta).toStrictEqual({
            isPermalinkSymbol: true,
          });
        }),
      )
      .isReady();

    await md.render("# H1");
  });
});
