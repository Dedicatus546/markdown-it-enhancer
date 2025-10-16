import type { RendererFn } from "../renderer";

export const html_block: RendererFn = (tokens, idx) =>
  tokens[idx].content;
