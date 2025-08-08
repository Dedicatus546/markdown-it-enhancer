import type { RendererFn } from "markdown-it-enhancer";

export const footnote_block_close: RendererFn<"sync"> = () =>
  "</ol>\n</section>\n";
