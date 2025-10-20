import {
  HeaderLinkPermalinkNormalizedOptions,
  HeaderLinkPermalinkOptions,
} from "../types";
import { mergeDuplicateClassAttrs } from "../utils";
import { permalinkDefaultOptions } from "./common";
import { makePermalink } from "./makePermalink";

export const headerLink = makePermalink<
  HeaderLinkPermalinkOptions,
  HeaderLinkPermalinkNormalizedOptions
>(
  (slug, opts, anchorOpts, state, idx) => {
    const linkTokens = [];

    const linkOpenToken = new state.Token("link_open", "a", 1);
    if (opts.class) {
      linkOpenToken.attrPush(["class", opts.class]);
    }
    linkOpenToken.attrPush(["href", opts.renderHref(slug, state)]);
    Object.entries(opts.renderAttrs(slug, state)).forEach(([key, value]) => {
      linkOpenToken.attrPush([key, `${value}`]);
    });
    linkOpenToken.attrs = mergeDuplicateClassAttrs(linkOpenToken.attrs ?? []);
    linkTokens.push(linkOpenToken);

    if (opts.safariReaderFix) {
      linkTokens.push(new state.Token("span_open", "span", 1));
    }
    linkTokens.push(...state.tokens[idx + 1].children);
    if (opts.safariReaderFix) {
      linkTokens.push(new state.Token("span_close", "span", -1));
    }
    linkTokens.push(new state.Token("link_close", "a", -1));

    state.tokens[idx + 1] = Object.assign(new state.Token("inline", "", 0), {
      children: linkTokens,
    });
  },
  Object.assign({}, permalinkDefaultOptions, {
    safariReaderFix: false,
  }),
);
