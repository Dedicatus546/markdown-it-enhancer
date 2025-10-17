import type { StateCore } from "@markdown-it-enhancer/core";

import type {
  MarkdownItAnchorNormalizedOptions,
  PermalinkBaseOptions,
} from "../types";

type RenderPermalinkImpl<T extends PermalinkBaseOptions, K> = (
  slug: string,
  opts: T & K,
  anchorOpts: MarkdownItAnchorNormalizedOptions,
  state: StateCore,
  idx: number,
) => void;

export const makePermalink = <T extends PermalinkBaseOptions, K>(
  renderPermalinkImpl: RenderPermalinkImpl<T, K>,
  defaultOptions: K,
) => {
  function renderPermalink(options: T) {
    const normalizedOptions = Object.assign({}, defaultOptions, options);

    return (
      slug: string,
      anchorOpts: MarkdownItAnchorNormalizedOptions,
      state: StateCore,
      idx: number,
    ) => {
      return renderPermalinkImpl(
        slug,
        normalizedOptions,
        anchorOpts,
        state,
        idx,
      );
    };
  }

  return renderPermalink;
};
