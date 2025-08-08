import type { Token, TokenAttr } from "markdown-it-enhancer";

import {
  LinkAfterHeaderPermalinkOptions,
  PermalinkNormalizedBaseOptions,
} from "../types";
import { mergeDuplicateClassAttrs } from "../utils";
import {
  permalinkDefaultOptions,
  permalinkSymbolMeta,
  position,
} from "./common";
import { makePermalink } from "./makePermalink";

export const linkAfterHeader = makePermalink<
  LinkAfterHeaderPermalinkOptions,
  PermalinkNormalizedBaseOptions &
    Required<
      Pick<
        LinkAfterHeaderPermalinkOptions,
        "style" | "space" | "wrapper" | "placement"
      >
    >
>(
  (slug, opts, anchorOpts, state, idx) => {
    if (
      ![
        "visually-hidden",
        "aria-label",
        "aria-describedby",
        "aria-labelledby",
      ].includes(opts.style)
    ) {
      throw new Error(
        `\`permalink.linkAfterHeader\` called with unknown style option \`${opts.style}\``,
      );
    }

    if (
      (opts.style === "visually-hidden" || opts.style === "aria-label") &&
      !opts.assistiveText
    ) {
      throw new Error(
        `\`permalink.linkAfterHeader\` called without the \`assistiveText\` option in \`${opts.style}\` style`,
      );
    }

    if (opts.style === "visually-hidden" && !opts.visuallyHiddenClass) {
      throw new Error(
        "`permalink.linkAfterHeader` called without the `visuallyHiddenClass` option in `visually-hidden` style",
      );
    }

    const title = state.tokens[idx + 1].children
      .filter((token) => token.type === "text" || token.type === "code_inline")
      .reduce((acc, t) => acc + t.content, "");

    const subLinkTokens: Array<Token> = [];
    const linkAttrs: Array<TokenAttr> = [];

    if (opts.class) {
      linkAttrs.push(["class", opts.class]);
    }

    linkAttrs.push(["href", opts.renderHref(slug, state)]);
    Object.entries(opts.renderAttrs(slug, state)).forEach(([key, value]) => {
      linkAttrs.push([key, `${value}`]);
    });

    if (opts.style === "visually-hidden") {
      subLinkTokens.push(
        Object.assign(new state.Token("span_open", "span", 1), {
          attrs: [["class", opts.visuallyHiddenClass]],
        }),
        Object.assign(new state.Token("text", "", 0), {
          content: opts.assistiveText(title),
        }),
        new state.Token("span_close", "span", -1),
      );

      if (opts.space) {
        const space = typeof opts.space === "string" ? opts.space : " ";
        const type = typeof opts.space === "string" ? "html_inline" : "text";
        subLinkTokens[position[opts.placement]](
          Object.assign(new state.Token(type, "", 0), { content: space }),
        );
      }

      subLinkTokens[position[opts.placement]](
        Object.assign(new state.Token("span_open", "span", 1), {
          attrs: [["aria-hidden", "true"]],
        }),
        Object.assign(new state.Token("html_inline", "", 0), {
          content: opts.symbol,
          meta: permalinkSymbolMeta,
        }),
        new state.Token("span_close", "span", -1),
      );
    } else {
      subLinkTokens.push(
        Object.assign(new state.Token("html_inline", "", 0), {
          content: opts.symbol,
          meta: permalinkSymbolMeta,
        }),
      );
    }

    if (opts.style === "aria-label") {
      linkAttrs.push(["aria-label", opts.assistiveText(title)]);
    } else if (["aria-describedby", "aria-labelledby"].includes(opts.style)) {
      linkAttrs.push([opts.style, slug]);
    }

    const linkTokens = [
      Object.assign(new state.Token("link_open", "a", 1), {
        attrs: mergeDuplicateClassAttrs(linkAttrs),
      }),
      ...subLinkTokens,
      new state.Token("link_close", "a", -1),
    ];

    state.tokens.splice(idx + 3, 0, ...linkTokens);

    if (opts.wrapper) {
      state.tokens.splice(
        idx,
        0,
        Object.assign(new state.Token("html_block", "", 0), {
          content: opts.wrapper[0] + "\n",
        }),
      );

      state.tokens.splice(
        idx + 3 + linkTokens.length + 1,
        0,
        Object.assign(new state.Token("html_block", "", 0), {
          content: opts.wrapper[1] + "\n",
        }),
      );
    }
  },
  Object.assign({}, permalinkDefaultOptions, {
    style: "visually-hidden" as const,
    space: true,
    placement: "after" as const,
    wrapper: null,
  }),
);
