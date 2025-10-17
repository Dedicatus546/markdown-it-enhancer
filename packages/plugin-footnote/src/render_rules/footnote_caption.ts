import type { RendererFn } from "@markdown-it-enhancer/core";

export const footnote_caption: RendererFn = (tokens, idx) => {
  let n = (tokens[idx].meta?.id ?? 0) + 1 + "";

  if ((tokens[idx].meta?.subId ?? 0) > 0) {
    n += `:${tokens[idx].meta!.subId}`;
  }

  return `[${n}]`;
};
