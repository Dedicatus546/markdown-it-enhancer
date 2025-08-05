import type { RendererFn } from "markdown-it-enhancer";

export const emoji_html: RendererFn = (tokens, idx) => {
  return tokens[idx].content;
};
