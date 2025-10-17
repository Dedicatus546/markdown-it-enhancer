import type { RendererFn } from "@markdown-it-enhancer/core";

export const footnote_anchor: RendererFn = async (
  tokens,
  idx,
  options,
  env,
  renderer,
) => {
  let id = await renderer.rules.footnote_anchor_name(
    tokens,
    idx,
    options,
    env,
    renderer,
  );

  if ((tokens[idx].meta?.subId ?? 0) > 0) {
    id += `:${tokens[idx].meta!.subId!}`;
  }

  /* ↩ with escape code to prevent display as Apple Emoji on iOS */
  return ` <a href="#fnref${id}" class="footnote-backref">\u21a9\uFE0E</a>`;
};
