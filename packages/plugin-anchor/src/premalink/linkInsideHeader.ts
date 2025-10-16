import {
  LinkInsideHeaderPermalinkNormalizedOptions,
  LinkInsideHeaderPermalinkOptions,
} from "../types";
import { mergeDuplicateClassAttrs } from "../utils";
import {
  permalinkDefaultOptions,
  permalinkSymbolMeta,
  position,
} from "./common";
import { makePermalink } from "./makePermalink";

export const linkInsideHeader = makePermalink<
  LinkInsideHeaderPermalinkOptions,
  LinkInsideHeaderPermalinkNormalizedOptions
>(
  (slug, opts, anchorOpts, state, idx) => {
    const linkOpenToken = new state.Token("link_open", "a", 1);
    if (opts.class) {
      linkOpenToken.attrPush(["class", opts.class]);
    }
    linkOpenToken.attrPush(["href", opts.renderHref(slug, state)]);
    if (opts.ariaHidden) {
      linkOpenToken.attrPush(["aria-hidden", "true"]);
    }
    Object.entries(opts.renderAttrs(slug, state)).forEach(([key, value]) => {
      linkOpenToken.attrPush([key, `${value}`]);
    });
    linkOpenToken.attrs = mergeDuplicateClassAttrs(linkOpenToken.attrs!);

    const htmlInlineToken = new state.Token("html_inline", "", 0);
    htmlInlineToken.content = opts.symbol;
    htmlInlineToken.meta = permalinkSymbolMeta;

    const linkCloseToken = new state.Token("link_close", "a", -1);

    const linkTokens = [linkOpenToken, htmlInlineToken, linkCloseToken];

    if (opts.space) {
      const space = typeof opts.space === "string" ? opts.space : " ";
      const type = typeof opts.space === "string" ? "html_inline" : "text";
      const token = new state.Token(type, "", 0);
      token.content = space;
      state.tokens[idx + 1].children[position[opts.placement]](token);
    }

    state.tokens[idx + 1].children[position[opts.placement]](...linkTokens);
  },
  Object.assign({}, permalinkDefaultOptions, {
    space: true,
    placement: "after" as const,
    ariaHidden: false,
  }),
);
