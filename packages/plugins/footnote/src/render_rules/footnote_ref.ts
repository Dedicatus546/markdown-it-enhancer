import type { RendererFn } from "markdown-it-enhancer";

export const footnote_ref: RendererFn<"sync"> = (
  tokens,
  idx,
  options,
  env,
  renderer,
) => {
  const id = renderer.rules.footnote_anchor_name(
    tokens,
    idx,
    options,
    env,
    renderer,
  );
  const caption = renderer.rules.footnote_caption(
    tokens,
    idx,
    options,
    env,
    renderer,
  );
  let refid = id;

  if ((tokens[idx].meta?.subId ?? 0) > 0) {
    refid += `:${tokens[idx].meta!.subId ?? 0}`;
  }

  return `<sup class="footnote-ref"><a href="#fn${id}" id="fnref${refid}">${caption}</a></sup>`;
};
