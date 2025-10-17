import type { RendererFn } from "@markdown-it-enhancer/core";

export const footnote_block_close: RendererFn = () =>
  "</ol>\n</section>\n";
