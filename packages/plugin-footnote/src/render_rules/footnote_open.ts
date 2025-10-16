import type { RendererFn } from "markdown-it-enhancer";

export const footnote_open: RendererFn = async (
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

  return `<li id="fn${id}" class="footnote-item">`;
};
