import type { RendererFn } from "../renderer";

export const html_block: RendererFn<"sync"> = (tokens, idx) =>
  tokens[idx].content;
