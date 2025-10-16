import type { RendererFn } from "../renderer";

export const html_inline: RendererFn = (tokens, idx) =>
  tokens[idx].content;
