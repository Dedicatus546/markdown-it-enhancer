import type { RendererFn } from "@markdown-it-enhancer/core";

export const emoji_html: RendererFn = (tokens, idx) => {
  return tokens[idx].content;
};
