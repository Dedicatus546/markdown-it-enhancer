import type { RendererFn } from "@markdown-it-enhancer/core";

export const footnote_anchor_name: RendererFn = (
  tokens,
  idx,
  _options,
  env,
) => {
  const n = (tokens[idx].meta?.id ?? 0) + 1 + "";
  let prefix = "";

  if (typeof env.docId === "string") {
    prefix = `-${env.docId}-`;
  }

  return prefix + n;
};
