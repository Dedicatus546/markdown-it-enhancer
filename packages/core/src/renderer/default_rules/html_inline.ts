import type { RendererFn } from "../renderer";

export const html_inline: RendererFn<"sync"> = (tokens, idx) =>
  tokens[idx].content;
