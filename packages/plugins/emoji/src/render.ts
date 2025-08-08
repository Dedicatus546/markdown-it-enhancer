import type { RendererFn } from "markdown-it-enhancer";

export const emoji_html: RendererFn<"sync"> = (tokens, idx) => {
  return tokens[idx].content;
};
