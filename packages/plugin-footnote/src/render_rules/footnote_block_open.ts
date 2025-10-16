import type { RendererFn } from "markdown-it-enhancer";

export const footnote_block_open: RendererFn = (
  _tokens,
  _idx,
  options,
) => {
  return (
    (options.xhtmlOut
      ? "<hr class=\"footnotes-sep\" />\n"
      : "<hr class=\"footnotes-sep\">\n")
    + "<section class=\"footnotes\">\n"
    + "<ol class=\"footnotes-list\">\n"
  );
};
